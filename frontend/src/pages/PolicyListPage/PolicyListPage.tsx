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

import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';

import DeleteButton from './DeleteButton';
import { ResizeTable } from 'components/ResizeTable';
import { ROUTES } from 'const/ROUTES';
import { useEffect, useState } from 'react';
import { PolicyItem, deletePolicy, getPolicyItems } from 'services/policy';


function PolicyListPage(): JSX.Element {


	const deleteConfirm = (name: string): void => {
		deletePolicy(name);
		setTimeout(() => {
			getPolicyItems().then((data) => {
				setPolices(data);
			});
		}, 200);
	};
	const [polices, setPolices] = useState<PolicyItem[]>([]);

	const tableColumns: ColumnsType<any> = [
		{
			title: 'Name',
			key: 'policy',
			dataIndex: 'policy',
			render: (data): JSX.Element => (
				<Link to={`${ROUTES.POLICES_LIST}/${data}`}>
					{data}
				</Link>
			),
		},
		{
			title: 'Action',
			dataIndex: '',
			width: 120,
			render: (data: any): JSX.Element =>
				DeleteButton({ policy: data.policy, deleteConfirm }),
		},
	];

	useEffect(() => {
		getPolicyItems().then((data) => {
			setPolices(data);
		});
	}, []);


	return (
		<div>
			<Link to={`${ROUTES.POLICES_LIST}/newPolicy`}>
				<Button icon={<PlusOutlined />}>New policy</Button>
			</Link>
			<br />
			<ResizeTable
				columns={tableColumns}
				dataSource={polices}
				rowKey="policy"
			/>
		</div>
	);
}


export default PolicyListPage;
