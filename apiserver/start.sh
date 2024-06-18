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

#This shell script is used to start the application the first time.
#Script should be called as ./startapp.sh <devaccount>, unless you want it to use the Cisco login username;
#On dev servers <devaccount> will most probably coincide with login username and Cisco CEC Account.
#Make sure to have the istioctl directory path exported to PATH before running the script.

LGrn="\033[1;32m"
NC="\033[0m"

echo "${LGrn}Deploying API Server...${NC}"
kubectl apply -f "$(dirname $0)/apiserver.yml"

apiserver_pod=$(echo $(kubectl get pods -l app=apiserver -o custom-columns=:metadata.name | tr -d "\n"))
echo "${LGrn}Waiting for ${apiserver_pod} to finish initialization...${NC}"
while [[ $(kubectl get pods ${apiserver_pod} -o 'jsonpath={..status.conditions[?(@.type=="Ready")].status}') != "True" ]];
do
	sleep 1
done

echo "${LGrn}API Server successfully launched!"
