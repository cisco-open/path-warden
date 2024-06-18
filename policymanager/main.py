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

from policy_mgr import *
from repo_mgr import *
from flask import jsonify, Flask, Response, request
import json

app = Flask(__name__)
init_repo()

@app.route("/policies", methods=['GET'])
def get_policies():
    try:
        policies_dict = get_all_policies()
        
        response = Response(response=json.dumps(policies_dict),
                            status=200)
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/policies/create/<string:policy>", methods=['POST'])
def post_policy(policy: str):
    try:
        policy_body = request.json["policy_body"]
        create_policy(policy=policy, body=policy_body)

        git_add(policy=policy)
        git_commit()
        git_push()

        response_dict = {"policies": [{"policy": policy, "policy_body": policy_body}]}
        response = Response(response=json.dumps(response_dict),
                            status=201)
        return response
    except FileExistsError as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 409
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/policies/read/<string:policy>", methods=['GET'])
def get_policy(policy: str):
    try:
        policy_body = read_policy(policy=policy)

        response_dict = {"policies": [{"policy": policy, "policy_body": policy_body}]}
        response = Response(response=json.dumps(response_dict),
                            status=200)
        return response
    except FileNotFoundError as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 404
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/policies/update/<string:policy>", methods=['PUT'])
def put_policy(policy: str):
    try:
        policy_body = request.json["policy_body"]
        update_policy(policy=policy, body=policy_body)

        git_add(policy=policy)
        git_commit()
        git_push()

        response_dict = {"policies": [{"policy": policy, "policy_body": policy_body}]}
        response = Response(response=json.dumps(response_dict),
                            status=201)
        return response
    except FileNotFoundError as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 404
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response


@app.route("/policies/delete/<string:policy>", methods=['DELETE'])
def remove_policy(policy: str):
    try:
        delete_policy(policy=policy)

        git_remove(policy=policy)
        git_commit()
        git_push()

        print("remove_policy: after git ops")

        response_dict = {"msg": f"Policy {policy} successfully deleted."}
        response = Response(response=json.dumps(response_dict),
                            status=201)
        return response
    except FileNotFoundError as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 404
        return response
    except Exception as e:
        response = jsonify({"exception": str(e)})
        response.status_code = 500
        return response

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
