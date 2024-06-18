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

LRed="\033[1;31m"
LGrn="\033[1;32m"
NC="\033[0m"

if [ -n "$1" ];
then
	devacct=$1
else
	devacct=$USER
fi

echo "${LGrn}Evaluating minikube docker-env...${NC}"
eval $(minikube docker-env)

#echo "${LGrn}Installing Istio service mesh...${NC}"
#./istio/istio-1.19.0/bin/istioctl install --set profile=demo -y
#kubectl label namespace default istio-injection=enabled

sh ./policymanager/build.sh $devacct

sh ./policymanager/start.sh

echo "${LGrn}Starting OPAL Server...${NC}"
sh ./OPAL/start.sh 

#echo "${LGrn}Starting Istio OpenTelemetry Collector...${NC}"
#kubectl apply -f ./istio/OTel_Config/otel-collector-istio.yml

#echo "${LGrn}Applying Telemetry Configmap to Istio...${NC}"
#kubectl apply -f ./istio/OTel_Config/otel-config-istio.yml

echo "${LGrn}Applying OpenTelemertry Agent Configmap...${NC}"
kubectl apply -f ./OTel/otel-agent-config.yml

echo "${LGrn}Starting EdgeProvenance OpenTelemertry Collector...${NC}"
kubectl apply -f ./OTel/otel-collector.yml

echo "${LGrn}Starting Jaeger All in One...${NC}"
kubectl apply -f ./OTel/jaeger.yml

sh ./mysqldb/start.sh

sh ./frontend/build.sh

sh ./apiserver/build.sh $devacct

sh ./apiserver/start.sh

echo "${LGrn}API Server logs:${NC}"
kubectl logs -l app=apiserver

echo "${LGrn}Done!${NC}"
