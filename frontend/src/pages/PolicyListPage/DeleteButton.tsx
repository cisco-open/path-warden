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

import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Modal, Tooltip, Typography } from 'antd';
import { useCallback } from 'react';

import { blue } from '@ant-design/colors';
import styled from 'styled-components';

export const TableLinkText = styled(Typography.Text)`
	color: ${blue.primary} !important;
	cursor: pointer;
`;


interface DeleteButtonProps {
	policy: string;
	deleteConfirm(name: string): void;
}

function DeleteButton({
	policy,
	deleteConfirm,
}: DeleteButtonProps): JSX.Element {
	const [modal, contextHolder] = Modal.useModal();

	const openConfirmationDialog = useCallback((): void => {
		modal.confirm({
			title: (
				<Typography.Title level={5}>
					Are you sure you want to delete the
					<span style={{ color: '#e42b35', fontWeight: 500 }}> {policy} </span>
					policy?
				</Typography.Title>
			),
			icon: <ExclamationCircleOutlined style={{ color: '#e42b35' }} />,
			onOk() {
				deleteConfirm(policy);
			},
			okText: 'Delete',
			okButtonProps: { danger: true },
			centered: true,
		});
	}, [deleteConfirm, modal, policy]);

	return (
		<>
			<Tooltip placement="left" title="Delete policy">
				<TableLinkText
					type="danger"
					onClick={(): void => {
						openConfirmationDialog();
					}}
				>
					<DeleteOutlined /> Delete
				</TableLinkText>
			</Tooltip>

			{contextHolder}
		</>
	);
}

// This is to avoid the type collision
function Wrapper(props: {
	policy: string;
	deleteConfirm(name: string): void;
}): JSX.Element {
	const { policy, deleteConfirm } = props;

	return (
		<DeleteButton
			{...{
				policy,
				deleteConfirm,
			}}
		/>
	);
}

export default Wrapper;
