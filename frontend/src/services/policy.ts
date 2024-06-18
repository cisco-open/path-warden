/**
 * Copyright 2024 Cisco Systems, Inc. and its affiliates
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from "axios";

export const labelAPI = axios.create({
	baseURL: `localhost:5000`,
});

export interface PolicyItem {
	policy: string;
	policy_body: string;
}

export interface PolicesStore {
	items: PolicyItem[];
	loading: boolean;
}

export const getPolicyItems = async () => {

	const [policesResponse] = await Promise.all([
		labelAPI.get<{ policies: PolicyItem[] }>(`/api/policies`),
	]);

	return policesResponse.data?.policies;

	// const data: PolicyItem[] = [
	// 	{
	// 		policy: 'test',
	// 		policy_body: 'test body',
	// 	},
	// ];

	// return data;
};

export const createPolicy = async (name: string, body: string) => {
	await Promise.all([
		labelAPI.post<{ policies: PolicyItem[] }>(`/api/policies/create/${name}`, {
			policy_body: body,
		}),
	]);
};

export const updatePolicy = async (name: string, body: string) => {
	await Promise.all([
		labelAPI.put<{ policies: PolicyItem[] }>(`/api/policies/update/${name}`, {
			policy_body: body,
		}),
	]);
};

export const deletePolicy = async (name: string) => {
	await Promise.all([
		labelAPI.delete<{ policies: PolicyItem[] }>(`/api/policies/delete/${name}`),
	]);
};
