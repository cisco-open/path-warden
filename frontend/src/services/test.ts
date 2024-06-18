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

// import { getLabelsMocks, getTestItemDataMocked } from './mockAPI';

import axios from "axios";

export const labelAPI = axios.create({
	baseURL: `localhost:5000`,
});

export type SeverityTypes = 'NORMAL' | 'INFO' | 'WARNING' | 'BRAKING';

interface LabelsDatabases {
	label: string;
	databases: string[];
}

export interface LabelItem {
	label: string;
	count: number;
	services?: string[];
	dataBaseCount?: number;
	databases?: string[];
}

export interface TestItem {
	id: string;
	parent: string;
	child: string;
	request_labels: string[];
	response_labels: string[];
	policy_violation?: string[];
	severity?: SeverityTypes;
}

export interface TestStore {
	items: TestItem[];
	loading: boolean;
}

export interface LabelStore {
	items: LabelItem[];
	loading: boolean;
}

export const getLabelItems = async (): Promise<LabelItem[]>  => {
	const [dbResponse] = await Promise.all([
		labelAPI.get<{ ldb_map: LabelsDatabases[] }>(`/api/labels_databases`),
	]);
	const [testResponse] = await Promise.all([
		labelAPI.get<{ count_maps: LabelItem[] }>(`/api/labels_service_count`),
	]);

	const countMaps = testResponse.data.count_maps.map<LabelItem>((data: LabelItem) => {
		const ret: LabelItem = {
			...data,
			databases:
				dbResponse.data.ldb_map.find((d: { label: string; }) => d.label === data.label)?.databases ||
				[],
		};
		ret.dataBaseCount = ret.databases?.length;
		return ret;
	});

	return countMaps;

	// const data = getLabelsMocks();

	// return data.count_maps;


};

export const getTestItems = async (): Promise<TestItem[]> => {

	const [testResponse] = await Promise.all([
		labelAPI.get<{ pcl_maps: TestItem[] }>(`/api/parent_child_labels`),
	]);

	return testResponse.data.pcl_maps.map((item) => ({
		...item,
		severity: item?.policy_violation?.length ? 'BRAKING' : 'NORMAL',
	}));

	// const data = getTestItemDataMocked();

	// return data.pcl_maps;
};
