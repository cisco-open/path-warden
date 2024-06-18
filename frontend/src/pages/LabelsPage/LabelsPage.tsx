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


import { useEffect, useState } from 'react';

import { tableColumns } from './utils';
import { ResizeTable } from 'components/ResizeTable';
import { LabelItem, getLabelItems } from 'services/test';

function LabelsPage(): JSX.Element {

	const [labels, setLabels] = useState<LabelItem[]>([]);

	useEffect(() => {
		getLabelItems().then((data) => {
			setLabels(data);
		});
	}, []);

	return (
		<div>
			<ResizeTable
				columns={tableColumns}
				dataSource={labels}
				rowKey="label"
			/>
		</div>
	);
}

export default LabelsPage;

