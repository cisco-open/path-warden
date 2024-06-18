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

import os
import requests
from flask import Flask, Response
from libs.mysql_traces_labels import *
from libs.lineage_propagation import *
from libs.opa_validation import *

app = Flask(__name__)
mysql = init_mysql(app)
init_services_labels(mysql=mysql)
register_service_as_db(mysql=mysql)
initialize_tracing()


@app.route("/", methods=['GET'])
@enable_tracing("GET_home")
def index():
    return "Hello Customer-Data!"


@app.route("/test", methods=['GET'])
@enable_tracing("GET_test")
@save_trace_to_db(mysql=mysql)
@manage_request_labels(mysql=mysql)
@manage_response_labels(mysql=mysql)
def test():
    print("Traceparent:", request.headers.get("traceparent"))
    print("Headers:", request.headers)

    request_headers = add_tracing_header()
    request_headers, _ = add_lineage_label(os.getenv("service_label"), request_headers)
    add_lineage_to_attributes()
    request_headers.update({"serviceparent": os.getenv("SERVICE_NAME")})

    print("Var:", "request_headers:", request_headers)

    response_labels = [os.getenv("service_label")]

    response_labels = ','.join(response_labels)
    response_headers = {"X-Response-Labels": response_labels}

    print("Var:", "response_headers:", response_headers)

    response = Response(response=json.dumps({"msg": "Customer-data response"}),
                        status=201,
                        headers=response_headers.items())

    return response


@app.route("/test_pii", methods=['GET'])
@enable_tracing("GET_test_pii")
@save_trace_to_db(mysql=mysql)
@manage_request_labels(mysql=mysql)
@manage_response_labels(mysql=mysql)
def test_pii():
    print("Traceparent:", request.headers.get("traceparent"))
    print("Headers:", request.headers)

    request_headers = add_tracing_header()
    request_headers, _ = add_lineage_label(os.getenv("service_label"), request_headers)
    add_lineage_to_attributes()
    request_headers.update({"serviceparent": os.getenv("SERVICE_NAME")})

    print("Var:", "request_headers:", request_headers)

    response_labels = [os.getenv("service_label"), "pii"]

    response_labels = ','.join(response_labels)
    response_headers = {"X-Response-Labels": response_labels}

    response = Response(response=json.dumps({"msg": "Customer-data response"}),
                        status=200,
                        headers=response_headers.items())

    return response


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
