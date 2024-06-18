# Copyright 2024 Cisco Systems, Inc. and its affiliates
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0

import requests
from flask import jsonify, Flask, Response, send_from_directory
from libs.mysql_traces_labels import *
from libs.lineage_propagation import *

app = Flask(__name__, static_folder="frontend/build", static_url_path='')
mysql = init_mysql(app)
initialize_tracing()


@app.route("/", methods=['GET'])
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route("/api/labels", methods=['GET'])
def get_labels():
    """
        Endpoint to get labels
        Response:
        {'labels': List(str)}
    """
    try:
        labels = {"labels": []}

        connector = mysql.connect()
        cursor = connector.cursor()

        query = 'SELECT * FROM labels'
        cursor.execute(query)
        result = cursor.fetchall()

        for entry in result:
            labels["labels"].append(entry[0])

        cursor.close()
        connector.close()

        response = jsonify(labels)
        response.status_code = 200
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/api/traces", methods=['GET'])
def get_traces():
    """
        Endpoint to get traces
        Response:
        {'traces': List(str)}
    """
    try:
        traces = {"traces": []}

        connector = mysql.connect()
        cursor = connector.cursor()

        query = 'SELECT * FROM traces'
        cursor.execute(query)
        result = cursor.fetchall()

        for entry in result:
            traces["traces"].append(entry[0])

        cursor.close()
        connector.close()

        response = jsonify(traces)
        response.status_code = 200
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/api/services", methods=['GET'])
def get_services():
    """
        Endpoint to get services
        Response:
        {'services': List(str)}
    """
    try:
        services = {"services": []}

        connector = mysql.connect()
        cursor = connector.cursor()

        query = 'SELECT * FROM services'
        cursor.execute(query)
        result = cursor.fetchall()

        for entry in result:
            services["services"].append(entry[0])

        cursor.close()
        connector.close()

        response = jsonify(services)
        response.status_code = 200
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/api/traces_labels", methods=['GET'])
def get_traces_labels():
    try:
        traces_labels = {"traces_labels": []}
        traces = []

        connector = mysql.connect()
        cursor = connector.cursor()

        query = 'SELECT * FROM traces'
        cursor.execute(query)
        result = cursor.fetchall()

        for entry in result:
            traces_labels["traces_labels"].append({"trace": entry[0], "labels": []})

        query = 'SELECT * FROM traces_labels'
        cursor.execute(query)
        result = cursor.fetchall()

        for entry in result:
            entry_trace, entry_label = entry
            for tl_obj_idx in range(len(traces_labels["traces_labels"])):
                tl_obj = traces_labels["traces_labels"][tl_obj_idx]
                if tl_obj["trace"] == entry_trace:
                    traces_labels["traces_labels"][tl_obj_idx]["labels"].append(entry_label)
                    break

        cursor.close()
        connector.close()

        response = jsonify(traces_labels)
        response.status_code = 200
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/api/services_labels", methods=['GET'])
def get_services_labels():
    try:
        connector = mysql.connect()
        cursor = connector.cursor()

        query = 'SELECT * FROM services_labels'
        cursor.execute(query)
        result = cursor.fetchall()

        cursor.close()
        connector.close()

        response = jsonify(result)
        response.status_code = 200
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/api/parent_child_labels", methods=['GET'])
def get_parent_child_labels():
    """
        Endpoint to get parent-child maps with label propagation
        Response:
        {'pcl_maps':
            [
                {
                "id": int,
                "parent": str,
                "child": str,
                "request_labels": List(str),
                "response_labels": List(str),
                "policy_violation": List(str)
                }, ...
            ]
        }
    """
    try:
        pcl_map = {"pcl_maps": []}

        connector = mysql.connect()
        cursor = connector.cursor()

        query = 'SELECT * FROM parent_child_labels'
        cursor.execute(query)
        result = cursor.fetchall()

        print("labels_service_count:result:", result)

        for entry in result:
            request_labels = [] if not entry[3] else entry[3].split(',')  # Not possible due to NOT NULL
            response_labels = [] if not entry[4] else entry[4].split(',')
            policy_violation_labels = [] if not entry[5] else entry[5].split(',')
            entry_map = {"id": entry[0],
                         "parent": entry[1],
                         "child": entry[2],
                         "request_labels": request_labels,
                         "response_labels": response_labels,
                         "policy_violation": policy_violation_labels}
            pcl_map["pcl_maps"].append(entry_map)

        cursor.close()
        connector.close()

        response = jsonify(pcl_map)
        response.status_code = 200
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/api/labels_service_count", methods=['GET'])
def get_labels_service_count():
    """
    Endpoint to get the count map for services per label.
    Response:
    {'count_maps':
        [
            {
            "label": str,
            "services": List(str),
            "count": int
            }, ...
        ]
    }
    """
    try:
        count_map = {"count_maps": []}

        connector = mysql.connect()
        cursor = connector.cursor()

        #ToDo: Also Reply Labels
        query = 'SELECT label FROM labels'

        cursor.execute(query)
        result = cursor.fetchall()
        print("/labels_service_count:label_tuples:", result)

        labels = [label[0] for label in result]

        for label in labels:
            count_map["count_maps"].append({"label": label})

            query = 'SELECT child FROM parent_child_labels ' \
                    'WHERE request_labels LIKE %s'
            data = (f"%{label}%")

            cursor.execute(query, data)
            result = cursor.fetchall()

            request_services = [service[0] for service in result]
            print("/labels_service_count:request_services:", request_services)

            query = 'SELECT parent FROM parent_child_labels ' \
                    'WHERE response_labels LIKE %s'
            data = (f"%{label}%")

            cursor.execute(query, data)
            result = cursor.fetchall()

            response_services = [service[0] for service in result]

            services = request_services + response_services

            count_map["count_maps"][-1].update({"services": services})
            count_map["count_maps"][-1].update({"count": len(services)})

        cursor.close()
        connector.close()

        print("/labels_service_count:count_map:", count_map)
        response = jsonify(count_map)
        response.status_code = 200
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/api/labels_databases", methods=['GET'])
def get_labels_databases():
    try:
        dummy_label_databases = {"ldb_map": []}
        ldb_map_dict = {}

        connector = mysql.connect()
        cursor = connector.cursor()

        query = 'SELECT services_labels.label, services_labels.service FROM services_labels '\
                'WHERE services_labels.service in ' \
                '( SELECT services.service FROM services WHERE services.is_db = 1 )'
        cursor.execute(query)
        result = cursor.fetchall()

        print("/labels_databases:result:",)

        for pair in result:
            if pair[0] in ldb_map_dict:
                ldb_map_dict[pair[0]].append(pair[1])
            else:
                ldb_map_dict.update({pair[0]: [pair[1]]})

        for label in ldb_map_dict:
            dummy_label_databases["ldb_map"].append({"label": label, "databases": ldb_map_dict[label]})
        
        ''' 
        dummy_label_databases = {"ldb_map": [
            {"label": "Mock-database-label-2", "databases": ["database-1", "database-2"]},
            {"label": "Mock-database-label-3", "databases": ["database-3"]},
            {"label": "Mock-database-label-4", "databases": ["database-4"]},
        ]}
        '''

        response = jsonify(dummy_label_databases)
        response.status_code = 200
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/api/policies", methods=['GET'])
def get_policies():
    try:
        policies_response = requests.get(url="http://policy-manager.default.svc.cluster.local:80/policies")
        
        response = Response(response=policies_response.content,
                            status=policies_response.status_code)
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/api/policies/create/<string:policy>", methods=['POST'])
def post_policy(policy: str):
    try:
        policies_response = requests.post(url=f"http://policy-manager.default.svc.cluster.local:80/policies/create/{policy}", json=request.json)

        response = Response(response=policies_response.content,
                            status=policies_response.status_code)
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/api/policies/read/<string:policy>", methods=['GET'])
def get_policy(policy: str):
    try:
        policies_response = requests.get(url=f"http://policy-manager.default.svc.cluster.local:80/policies/read/{policy}")

        response = Response(response=policies_response.content,
                            status=policies_response.status_code)
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/api/policies/update/<string:policy>", methods=['PUT'])
def put_policy(policy: str):
    try:
        policies_response = requests.put(url=f"http://policy-manager.default.svc.cluster.local:80/policies/update/{policy}", json=request.json)

        response = Response(response=policies_response.content,
                            status=policies_response.status_code)
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/api/policies/delete/<string:policy>", methods=['DELETE'])
def remove_policy(policy: str):
    try:
        policies_response = requests.delete(url=f"http://policy-manager.default.svc.cluster.local:80/policies/delete/{policy}")

        response = Response(response=policies_response.content,
                            status=policies_response.status_code)
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
