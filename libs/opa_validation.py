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
from flask import Response
from flaskext.mysql import MySQL
from functools import wraps
from .mysql_traces_labels import *


OPA_URL = "http://localhost:8181"
OPA_DATA_URL = OPA_URL + "/v1/data"
SERVICE_NAME = os.getenv("SERVICE_NAME")
FORBIDDEN_RESPONSE = Response(response=json.dumps({"msg": "Label passing forbidden."}),
                              status=403)

def get_opa_data_policies():
    OPA_DATA_SERVICE_POLICIES_URL = f"{OPA_DATA_URL}/policies"
    policies = requests.get(url=OPA_DATA_SERVICE_POLICIES_URL).json()["result"]
    return policies

def get_policies_from_labels(labels: list, policies: list):
    policy_labels = [policy_label for policy_label in labels if policy_label in policies]
    return policy_labels

def validate_labels(destination_service: str, labels: list, mysql: MySQL):
    policies = get_opa_data_policies()
    policy_labels = get_policies_from_labels(labels=labels, policies=policies)

    for policy_label in policy_labels:
        OPA_DATA_POLICY_EVAL_URL = f"{OPA_DATA_URL}/{policy_label}"
        eval_input = {"input": {"service": destination_service}}
        result = requests.post(url=OPA_DATA_POLICY_EVAL_URL, json=eval_input)
        result_json = result.json()
        if result_json:
            result_value = result_json['result']["allow"]
            print("validate_labels:result_value:", result_value)
            if not result_value:
                register_policy_violation(mysql=mysql, policy=policy_label)
                return False
        else:
            return False

    return True

def validate_before(mysql: MySQL):
    def inner(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            lineage_label_set = get_lineage_label_set()
            if lineage_label_set:
                labels = json.loads(lineage_label_set)["LabelSet"]
                print("validate_before:labels:", labels)
                result = validate_labels(destination_service=SERVICE_NAME, labels=labels, mysql=mysql)
                if result:
                    res = func(*args, **kwargs)
                else:
                    res = FORBIDDEN_RESPONSE

            else:
                res = func(*args, **kwargs)
            return res
        return wrapper
    return inner

def validate_after(mysql: MySQL):
    def inner(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            res = func(*args, **kwargs)

            labels_string = res.headers.get("X-Response-Labels")
            print("validate_after:labels_string:", labels_string)
            labels = labels_string.split(',')
            print("validate_after:labels:", labels)

            parent = get_header_from_flask_request('serviceparent')
            if parent:
                result = validate_labels(destination_service=parent, labels=labels, mysql=mysql)

                if not result:
                    res = FORBIDDEN_RESPONSE

            return res
        return wrapper
    return inner