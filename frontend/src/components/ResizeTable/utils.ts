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

import { DynamicColumnsKey } from './contants';
import {
	GetNewColumnDataFunction,
	GetVisibleColumnsFunction,
	SetVisibleColumnsProps,
} from './types';

export const getVisibleColumns: GetVisibleColumnsFunction = ({
	tablesource,
	dynamicColumns,
	columnsData,
}) => {
	let columnVisibilityData: { [key: string]: boolean };
	try {
		const storedData = localStorage.getItem(tablesource);
		if (typeof storedData === 'string' && dynamicColumns) {
			columnVisibilityData = JSON.parse(storedData);
			return dynamicColumns.filter((column) => {
				if (column.key && !columnsData?.find((c) => c.key === column.key)) {
					if (column.key) {
						return columnVisibilityData[column.key as string];
					}
				}
				return false;
			});
		}

		const initialColumnVisibility: Record<string, boolean> = {};
		Object.values(DynamicColumnsKey).forEach((key) => {
			initialColumnVisibility[key] = false;
		});

		localStorage.setItem(tablesource, JSON.stringify(initialColumnVisibility));
	} catch (error) {
		console.error(error);
	}
	return [];
};

export const setVisibleColumns = ({
	checked,
	index,
	tablesource,
	dynamicColumns,
}: SetVisibleColumnsProps): void => {
	try {
		const storedData = localStorage.getItem(tablesource);
		if (typeof storedData === 'string' && dynamicColumns) {
			const columnVisibilityData = JSON.parse(storedData);
			const { key } = dynamicColumns[index];
			if (key) {
				columnVisibilityData[key as string] = checked;
			}
			localStorage.setItem(tablesource, JSON.stringify(columnVisibilityData));
		}
	} catch (error) {
		console.error(error);
	}
};

export const getNewColumnData: GetNewColumnDataFunction = ({
	prevColumns,
	checked,
	dynamicColumns,
	index,
}) => {
	if (checked && dynamicColumns) {
		return prevColumns
			? [
					...prevColumns.slice(0, prevColumns.length - 1),
					dynamicColumns[index],
					prevColumns[prevColumns.length - 1],
			  ]
			: undefined;
	}
	return prevColumns && dynamicColumns
		? prevColumns.filter((column) => dynamicColumns[index].title !== column.title)
		: undefined;
};
