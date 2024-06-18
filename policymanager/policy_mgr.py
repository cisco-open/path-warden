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

POLICIES_DIR_PATH = os.path.join(os.getcwd(), "policies")

def get_policy_file_path(policy: str):
    policy_file_path = os.path.join(POLICIES_DIR_PATH, f"{policy}.rego")
    return policy_file_path

def policy_exists(policy: str):
    policy_file_path = get_policy_file_path(policy=policy)
    if os.path.exists(policy_file_path):
        return True
    else:
        return False

def get_all_policies():
    policies_files_list = os.listdir(path=POLICIES_DIR_PATH)
    policies_list = [policy[:-5] for policy in policies_files_list if policy != '.git']
    policies_dict = {"policies": []}
    for policy in policies_list:
        policy_body = read_policy(policy=policy)
        policies_dict["policies"].append({"policy": policy, "policy_body": policy_body})
    return policies_dict

def create_policy(policy: str, body: str):
    if policy_exists(policy=policy):
        raise FileExistsError
    policy_file_path = get_policy_file_path(policy=policy)
    with open(policy_file_path, 'w') as policy_file:
        policy_file.write(body)
    
def read_policy(policy: str):
    if not policy_exists(policy=policy):
        raise FileNotFoundError
    policy_file_path = get_policy_file_path(policy=policy)
    with open(policy_file_path, 'r') as policy_file:
        policy_body = policy_file.read()
    return policy_body

def update_policy(policy: str, body: str):
    if not policy_exists(policy=policy):
        raise FileNotFoundError
    policy_file_path = get_policy_file_path(policy=policy)
    with open(policy_file_path, 'w') as policy_file:
        policy_file.write(body)

def delete_policy(policy: str):
    if not policy_exists(policy=policy):
        raise FileNotFoundError
    os.remove(f"{POLICIES_DIR_PATH}/{policy}.rego")
