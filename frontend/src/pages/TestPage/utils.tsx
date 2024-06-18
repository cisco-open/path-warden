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



import { cloneDeep, find, uniq, uniqBy, groupBy } from 'lodash-es';
// import { graphDataType } from './ServiceMap';
// import { SeverityTypes, TestItem } from 'store/actions';
import styled from 'styled-components';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';
import { ROUTES } from 'const/ROUTES';

const MIN_WIDTH = 10;
const MAX_WIDTH = 20;
const DEFAULT_FONT_SIZE = 6;

export const getDimensions = (num: any, highest: any) => {
	const percentage = (num / highest) * 100;
	const width = (percentage * (MAX_WIDTH - MIN_WIDTH)) / 100 + MIN_WIDTH;
	const fontSize = DEFAULT_FONT_SIZE;
	return {
		fontSize,
		width,
	};
};

export const getGraphData = (serviceMap: any, isDarkMode: any) => {
	const { items } = serviceMap;
	const services = Object.values(groupBy(items, 'child')).map((e: any) => {
		return {
			serviceName: e[0].child,
			errorRate: 0,
			callRate: 0,
			severity: e[0].severity
		}
	});
	// const highestCallCount = 1;
	const highestCallRate = 1;

	// const divNum = Number(
	// 	String(1).padEnd(highestCallCount.toString().length, '0'),
	// );

	const links = cloneDeep(items).map((node: any) => {
		const { parent, child, request_labels, response_labels, severity, policy_violation } = node;
		let color = isDarkMode ? '#7CA568' : '#D5F2BB';
		if (severity === 'BRAKING') {
			color = isDarkMode ? '#DB836E' : '#F98989';
		}
		if (severity === 'WARNING') {
			color = isDarkMode ? '#AAAA02' : '#DADA00';
		}
		return {
			request_labels: request_labels,
			response_labels: response_labels,
			source: parent,
			target: child,
			severity,
			color,
			policy_violation,
		};
	});
	const uniqParent = uniqBy(cloneDeep(items), 'parent').map((e: any) => e.parent);
	const uniqChild = uniqBy(cloneDeep(items), 'child').map((e: any) => e.child);
	const uniqNodes = uniq([...uniqParent, ...uniqChild]);
	const nodes = uniqNodes.map((node: any, i: any) => {
		const service = find(services, (service: any) => service.serviceName === node);
		let color = isDarkMode ? '#7CA568' : '#D5F2BB';
		if (!service) {
			return {
				id: node,
				group: i + 1,
				fontSize: DEFAULT_FONT_SIZE,
				width: MIN_WIDTH,
				color,
				nodeVal: MIN_WIDTH,
			};
		}
		if (service.severity === 'BRAKING') {
			color = isDarkMode ? '#DB836E' : '#F98989';
		}
		if (service.severity === 'WARNING') {
			color = isDarkMode ? '#AAAA02' : '#DADA00';
		}
		const { fontSize, width } = getDimensions(service.callRate, highestCallRate);
		return {
			id: node,
			group: i + 1,
			fontSize,
			width,
			color,
			nodeVal: width,
		};
	});
	return {
		nodes,
		links,
	};
};

export const getZoomPx = (): number => {
	const { width } = window.screen;
	if (width < 1400) {
		return 190;
	}
	if (width > 1400 && width < 1700) {
		return 380;
	}
	if (width > 1700) {
		return 470;
	}
	return 190;
};

export const getTooltip = (link: any) => {
	return `<div style="color:#333333;padding:12px;background: white;border-radius: 2px;">
				<div>
					Requests Labels:
				<div>
				<div>
					${link.request_labels?.join(', ')}
				</div>
				<div>
					Response Labels:
				<div>
				<div>
					${link.response_labels?.join(', ')}
				</div>
				${(link.policy_violation && `
					<div>
						Policy Violation:
					<div>
					<div>
						${link.policy_violation?.join(', ')}
					</div>
				`) || ''}
		</div>`;
};

export const transformLabel = (label: string) => {
	const MAX_LENGTH = 13;
	const MAX_SHOW = 10;
	if (label.length > MAX_LENGTH) {
		return `${label.slice(0, MAX_SHOW)}...`;
	}
	return label;
};

export const Container = styled.div`
	.force-graph-container {
		overflow: scroll;
	}

	.force-graph-container .graph-tooltip {
		background: black;
		padding: 1px;
		.keyval {
			display: flex;
			.key {
				margin-right: 4px;
			}
			.val {
				margin-left: auto;
			}
		}
	}

	.map {
		position: relative;
		max-width: 100%;
		display: flex;
		.first {
			width: 80%;
		}
		.sec {
			width: 20%;
		}
	}
`;

function arrayDiv(d?: string[]): JSX.Element {
	return (
		<div>
			{d?.map((i) => (
				<div key={i}>{i}</div>
			))}
		</div>
	);
}

function severityDiv(d: any): JSX.Element {
	switch (d) {
		case 'INFO':
			return <InfoCircleOutlined style={{ color: 'blue' }} />;
		case 'WARNING':
			return <ExclamationCircleOutlined style={{ color: 'yellow' }} />;
		case 'BRAKING':
			return <CloseCircleOutlined style={{ color: 'red' }} />;
		default:
			return <CheckCircleOutlined style={{ color: 'green' }} />;
	}
}

export const tableColumns: ColumnsType<any> = [
	{
		key: 'severity',
		dataIndex: 'severity',
		render: severityDiv,
	},
	{
		title: 'Parent',
		key: 'parent',
		dataIndex: 'parent',
	},
	{
		title: 'Child',
		key: 'child',
		dataIndex: 'child',
	},
	{
		title: 'Request Labels',
		key: 'request_labels',
		dataIndex: 'request_labels',
		render: arrayDiv,
	},
	{
		title: 'Response Labels',
		key: 'response_labels',
		dataIndex: 'response_labels',
		render: arrayDiv,
	},

	{
		title: 'Policy violation',
		key: 'policy_violation',
		dataIndex: 'policy_violation',
		render: (data): JSX.Element => (
			<Link to={`${ROUTES.POLICES_LIST}/${data}`}>
				{data}
			</Link>
		),
	},
];

export const tableDbColumns: ColumnsType<{ name: string }> = [
	{
		title: 'DB',
		key: 'name',
		dataIndex: 'name',
	},
];

