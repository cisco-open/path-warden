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

import { SaveOutlined } from '@ant-design/icons';
import { Editor } from '@monaco-editor/react';
import { Button, Input } from 'antd';
import Title from 'antd/es/typography/Title';
import { ROUTES } from 'const/ROUTES';
import history from 'lib/history';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PolicyItem, createPolicy, getPolicyItems, updatePolicy } from 'services/policy';




function PolicyEditorPage(): JSX.Element {
	const { name } = useParams<{ name: string }>();
	const isNew = name === 'newPolicy';
	const [polices, setPolices] = useState<PolicyItem[]>([]);

	const [editorValue, setEditorValue] = useState(
		polices.find((d) => d.policy === name)?.policy_body,
	);
	const [newName, setNewName] = useState('');

	useEffect(() => {
		getPolicyItems().then((data) => {
			setPolices(data);
		});
	}, []);

	useEffect(() => {
		setEditorValue(polices.find((d: any) => d.policy === name)?.policy_body);
	}, [name, polices]);

	return (
		<div>
			{isNew ? (
				<Input
					placeholder="Policy name"
					allowClear
					onChange={(el): void => setNewName(el.target.value)}
				/>
			) : (
				<Title level={5}>{name}</Title>
			)}
			<Editor
				onChange={(newValue): void => setEditorValue(newValue)}
				value={editorValue}
				language="plaintext"
				height="70vh"
			/>
			<Button
				icon={<SaveOutlined />}
				onClick={(): void => {
					if (!editorValue || newName === name) return;
					if (isNew) {
						createPolicy(newName, editorValue);
					} else {
						if(name) {
							updatePolicy(name, editorValue);
						}
					}
					history.push(ROUTES.POLICES_LIST);
				}}
			>
				Save
			</Button>
		</div>
	);
}

export default PolicyEditorPage;
