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
import './DynamicColumnTable.syles.scss';

import { SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown, MenuProps, Switch } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { memo, useEffect, useState } from 'react';
import { popupContainer } from 'utils/selectPopupContainer';

import ResizeTable from './ResizeTable';
import { DynamicColumnTableProps } from './types';
import {
	getNewColumnData,
	getVisibleColumns,
	setVisibleColumns,
} from './utils';

function DynamicColumnTable({
	tablesource,
	columns,
	dynamicColumns,
	onDragColumn,
	...restProps
}: DynamicColumnTableProps): JSX.Element {
	const [columnsData, setColumnsData] = useState<ColumnsType | undefined>(
		columns,
	);

	useEffect(() => {
		const visibleColumns = getVisibleColumns({
			tablesource,
			columnsData: columns,
			dynamicColumns,
		});
		setColumnsData((prevColumns) =>
			prevColumns
				? [
						...prevColumns.slice(0, prevColumns.length - 1),
						...visibleColumns,
						prevColumns[prevColumns.length - 1],
				  ]
				: undefined,
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const onToggleHandler = (index: number) => (
		checked: boolean,
		event: React.MouseEvent<HTMLButtonElement>,
	): void => {
		event.stopPropagation();
		setVisibleColumns({
			tablesource,
			dynamicColumns,
			index,
			checked,
		});
		setColumnsData((prevColumns) =>
			getNewColumnData({
				checked,
				index,
				prevColumns,
				dynamicColumns,
			}),
		);
	};

	const items: MenuProps['items'] =
		dynamicColumns?.map((column, index) => ({
			label: (
				<div className="dynamicColumnsTable-items">
					<div>{column.title?.toString()}</div>
					<Switch
						checked={columnsData?.findIndex((c) => c.key === column.key) !== -1}
						onChange={onToggleHandler(index)}
					/>
				</div>
			),
			key: index,
			type: 'checkbox',
		})) || [];

	return (
		<div className="DynamicColumnTable">
			{dynamicColumns && (
				<Dropdown
					getPopupContainer={popupContainer}
					menu={{ items }}
					trigger={['click']}
				>
					<Button
						className="dynamicColumnTable-button"
						size="middle"
						icon={<SettingOutlined />}
					/>
				</Dropdown>
			)}

			<ResizeTable
				columns={columnsData}
				onDragColumn={onDragColumn}
				{...restProps}
			/>
		</div>
	);
}

DynamicColumnTable.defaultProps = {
	onDragColumn: undefined,
};

export default memo(DynamicColumnTable);
