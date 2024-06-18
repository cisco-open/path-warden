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

import { LabelItem, TestItem } from './test';

enum Services {
	WebPortal = 'Web portal',
	TransactionProcessing = 'Transaction processing',
	Fulfillment = 'Fulfillment',
	Shipping = 'Shipping',
	Accounting = 'Accounting',
	CustomerData = 'Customer Data',
	Inventory = 'Inventory',
	ShippingRecords = 'Shipping Records',
}

enum DataBaseEnum {
	Accounting = 'Accounting Db',
	CustomerData = 'Customer Data Db',
	Inventory = 'Inventory Db',
	ShippingRecords = 'Shipping Records Db',
}

enum LabelsEnum {
	WebPortal = 'Web portal Label',
	TransactionProcessing = 'Transaction processing label',
	Fulfillment = 'Fulfillment label',
	Shipping = 'Shipping label',
	Accounting = 'Accounting Db label',
	CustomerData = 'Customer Data Db label',
	Inventory = 'Inventory Db label',
	ShippingRecords = 'Shipping Records Db label',
}

export function getTestItemDataMocked(): { pcl_maps: TestItem[] } {
	const data: TestItem[] = [
		{
			id: '1',
			parent: Services.WebPortal,
			child: Services.TransactionProcessing,
			request_labels: [LabelsEnum.WebPortal],
			response_labels: [LabelsEnum.TransactionProcessing, LabelsEnum.Accounting],
			severity: 'NORMAL',
		},

		{
			id: '2',
			parent: Services.WebPortal,
			child: Services.Fulfillment,
			request_labels: [LabelsEnum.WebPortal],
			response_labels: [
				LabelsEnum.Fulfillment,
				LabelsEnum.Shipping,
				LabelsEnum.CustomerData,
			],
			// policy_violation: ['EX_POLICY_VIOLATING'],
			// severity: 'BRAKING',
		},

		{
			id: '3',
			parent: Services.Fulfillment,
			child: Services.Shipping,
			request_labels: [LabelsEnum.WebPortal, LabelsEnum.Fulfillment],
			response_labels: [LabelsEnum.CustomerData, LabelsEnum.Shipping],
			// severity: 'WARNING',
			// policy_violation: ['EX_POLICY_WARNING'],
		},

		{
			id: '4',
			parent: Services.TransactionProcessing,
			child: Services.Accounting,
			request_labels: [LabelsEnum.WebPortal, LabelsEnum.TransactionProcessing],
			response_labels: [LabelsEnum.Accounting],
		},

		{
			id: '5',
			parent: Services.TransactionProcessing,
			child: Services.CustomerData,
			request_labels: [LabelsEnum.WebPortal, LabelsEnum.TransactionProcessing],
			response_labels: [],
		},

		{
			id: '6',
			parent: Services.Fulfillment,
			child: Services.Inventory,
			request_labels: [LabelsEnum.WebPortal, LabelsEnum.Fulfillment],
			response_labels: [],
		},

		{
			id: '7',
			parent: Services.Shipping,
			child: Services.CustomerData,
			request_labels: [
				LabelsEnum.WebPortal,
				LabelsEnum.Fulfillment,
				LabelsEnum.Shipping,
			],
			response_labels: [LabelsEnum.CustomerData],
			policy_violation: ['EX_POLICY_VIOLATING'],
			severity: 'BRAKING',
		},

		{
			id: '8',
			parent: Services.Shipping,
			child: Services.ShippingRecords,
			request_labels: [
				LabelsEnum.WebPortal,
				LabelsEnum.Fulfillment,
				LabelsEnum.Shipping,
			],
			response_labels: [],
		},
	];
	return { pcl_maps: data };
}

export function getLabelsMocks(): { count_maps: LabelItem[] } {
	const data: LabelItem[] = [
		{
			label: LabelsEnum.WebPortal,
			count: 8,
			dataBaseCount: 4,
			databases: Object.values(DataBaseEnum),
		},
		{
			label: LabelsEnum.TransactionProcessing,
			count: 3,
			dataBaseCount: 2,
			databases: [DataBaseEnum.Accounting, DataBaseEnum.CustomerData],
		},
		{
			label: LabelsEnum.Fulfillment,
			count: 5,
			dataBaseCount: 3,
			databases: [
				DataBaseEnum.CustomerData,
				DataBaseEnum.Inventory,
				DataBaseEnum.ShippingRecords,
			],
		},
		{
			label: LabelsEnum.Accounting,
			count: 2,
			dataBaseCount: 1,
			databases: [DataBaseEnum.Accounting],
		},
		{
			label: LabelsEnum.CustomerData,
			count: 3,
			dataBaseCount: 1,
			databases: [DataBaseEnum.CustomerData],
		},
		{
			label: LabelsEnum.Inventory,
			count: 0,
			dataBaseCount: 1,
			databases: [DataBaseEnum.Inventory],
		},
		{
			label: LabelsEnum.ShippingRecords,
			count: 0,
			dataBaseCount: 1,
			databases: [DataBaseEnum.ShippingRecords],
		},
	];

	return { count_maps: data };
}
