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

/* eslint-disable @typescript-eslint/no-explicit-any */
import { TableProps } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { ColumnGroupType, ColumnType } from 'antd/lib/table';

import { TableDataSource } from './contants';

export interface ResizeTableProps extends TableProps<any> {
	onDragColumn?: (fromIndex: number, toIndex: number) => void;
}
export interface DynamicColumnTableProps extends TableProps<any> {
	tablesource: typeof TableDataSource[keyof typeof TableDataSource];
	dynamicColumns: TableProps<any>['columns'];
	onDragColumn?: (fromIndex: number, toIndex: number) => void;
}

export type GetVisibleColumnsFunction = (
	props: GetVisibleColumnProps,
) => (ColumnGroupType<any> | ColumnType<any>)[];

export type GetVisibleColumnProps = {
	tablesource: typeof TableDataSource[keyof typeof TableDataSource];
	dynamicColumns?: ColumnsType<any>;
	columnsData?: ColumnsType;
};

export type SetVisibleColumnsProps = {
	checked: boolean;
	index: number;
	tablesource: typeof TableDataSource[keyof typeof TableDataSource];
	dynamicColumns?: ColumnsType<any>;
};

type GetNewColumnDataProps = {
	prevColumns?: ColumnsType;
	checked: boolean;
	dynamicColumns?: ColumnsType<any>;
	index: number;
};

export type GetNewColumnDataFunction = (
	props: GetNewColumnDataProps,
) => ColumnsType | undefined;
