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

sh $(dirname $0)/accounting/start.sh
sh $(dirname $0)/customer-data/start.sh
sh $(dirname $0)/inventory/start.sh
sh $(dirname $0)/shipping-records/start.sh

sh $(dirname $0)/web-portal/start.sh
sh $(dirname $0)/transaction-processing/start.sh
sh $(dirname $0)/fulfillment/start.sh
sh $(dirname $0)/shipping/start.sh