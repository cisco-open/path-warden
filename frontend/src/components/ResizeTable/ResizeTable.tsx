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

/* eslint-disable react/jsx-props-no-spreading */

import { Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import {
	SyntheticEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import ReactDragListView from 'react-drag-listview';
import { ResizeCallbackData } from 'react-resizable';

import ResizableHeader from './ResizableHeader';
import { DragSpanStyle } from './styles';
import { ResizeTableProps } from './types';

function ResizeTable({
	columns,
	onDragColumn,
	...restProps
}: ResizeTableProps): JSX.Element {
	const [columnsData, setColumns] = useState<ColumnsType>([]);

	const dragColumnParams = {
		ignoreSelector: '.react-resizable-handle',
		nodeSelector: 'th',
		handleSelector: '.dragHandler',
	};

	const handleResize = useCallback(
		(index: number) => (
			_e: SyntheticEvent<Element>,
			{ size }: ResizeCallbackData,
		): void => {
			const newColumns = [...columnsData];
			newColumns[index] = {
				...newColumns[index],
				width: size.width,
			};
			setColumns(newColumns);
		},
		[columnsData],
	);

	const mergedColumns = useMemo(
		() =>
			columnsData.map((col, index) => ({
				...col,
				...(onDragColumn && {
					title: (
						<DragSpanStyle className="dragHandler">
							{col?.title?.toString() || ''}
						</DragSpanStyle>
					),
				}),
				onHeaderCell: (column: ColumnsType<unknown>[number]): unknown => ({
					width: column.width,
					onResize: handleResize(index),
				}),
			})) as ColumnsType<any>,
		[columnsData, onDragColumn, handleResize],
	);

	const tableParams = useMemo(
		() => ({
			...restProps,
			components: { header: { cell: ResizableHeader } },
			columns: mergedColumns,
		}),
		[mergedColumns, restProps],
	);

	useEffect(() => {
		if (columns) {
			setColumns(columns);
		}
	}, [columns]);

	return onDragColumn ? (
		<ReactDragListView.DragColumn {...dragColumnParams} onDragEnd={onDragColumn}>
			<Table {...tableParams} />
		</ReactDragListView.DragColumn>
	) : (
		<Table {...tableParams} />
	);
}

ResizeTable.defaultProps = {
	onDragColumn: undefined,
};

export default ResizeTable;
