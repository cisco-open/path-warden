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

import { ResizeTable } from 'components/ResizeTable';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
// import {
// 	LabelStore,
// 	TestStore,
// } from 'store/actions';

import Map from './Map';
import { Container, tableColumns, tableDbColumns } from './utils';
import { LabelItem, TestItem, getLabelItems, getTestItems } from 'services/test';


function TestPage(): JSX.Element {
	const allLabels = 'All labels';
	const fgRef = useRef<any>();
	const fRef = useRef<any>();
	const { name } = useParams<{ name: string }>();

	const [tests, setTests] = useState<TestItem[]>();
	const [labels, setLabels] = useState<LabelItem[]>([]);

	const [selectedLabel, setSelectedLabel] = useState(name || allLabels);
	const [displayedTests, setDisplayedTests] = useState<any>(tests);
	const [displayedDb, setDisplayedDb] = useState<{ name: string }[]>(
		labels
			.filter((d: any) => selectedLabel === allLabels || d.label === selectedLabel)
			.reduce<{ name: string }[]>((acc: any, d: any) => {
				if (d.databases) {
					acc.push(...d.databases.map((db: any) => ({ name: db })));
				}
				return acc.filter((a: any, i: any) => acc.findIndex((b: any) => b.name === a.name) === i);
			}, []),
	);

	// console.log('vasss labels', labels);

	useEffect(() => {
		getLabelItems().then((data) => {
			setLabels(data);
		});
		getTestItems().then((data) => {
			setTests(data);
		});
	}, []);

	useEffect(() => {
		fgRef.current?.d3Force('charge').strength(-400);
	});

	useEffect(() => {
		setDisplayedTests({
			...tests,
			items: tests?.filter(
				(item: any) =>
					selectedLabel === allLabels ||
					item.request_labels.includes(selectedLabel) ||
					item.response_labels.includes(selectedLabel),
			),
		});

		setDisplayedDb(
			labels
				.filter((d: any) => selectedLabel === allLabels || d.label === selectedLabel)
				.reduce<{ name: string }[]>((acc: any, d: any) => {
					if (d.databases) {
						acc.push(...d.databases.map((db: any) => ({ name: db })));
					}
					return acc.filter((a: any, i: any) => acc.findIndex((b: any) => b.name === a.name) === i);
				}, []),
		);
	}, [labels, selectedLabel, tests]);

	// const labelsConcat: string[] = tests.items.reduce<string[]>(
	// 	(acc, d) => acc.concat(d.labels),
	// 	[],
	// );

	// const labels = [all].concat(
	// 	labelsConcat.filter((d, i) => labelsConcat.indexOf(d) === i),
	// );

	return (
		<div style={{ color: 'red' }}>
			<div>
				<Container>
					<div className="map">
						<div ref={fRef} className="first">
							{displayedTests && (
								<Map
									fgRef={fgRef}
									serviceMap={displayedTests}
									width={fRef.current?.offsetWidth}
								/>
							)}
						</div>
						<div className="sec">
							<ResizeTable
								columns={tableDbColumns}
								dataSource={displayedDb}
								rowKey="name"
								pagination={{ pageSize: 7 }}
							/>
						</div>
					</div>
				</Container>
			</div>
			{!name && (
				<select
					value={selectedLabel}
					onChange={(e): void => setSelectedLabel(e.target.value)}
				>
					<option key={allLabels} value={allLabels}>
						{allLabels}
					</option>
					{labels.map((item: any) => (
						<option key={item.label} value={item.label}>
							{item.label}
						</option>
					))}
				</select>
			)}
			<ResizeTable
				columns={tableColumns}
				dataSource={displayedTests?.items}
				rowKey="id"
			/>
			<br />
		</div>
	);
}
export default TestPage;
