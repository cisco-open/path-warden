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


import { memo } from 'react';
import { ForceGraph2D } from 'react-force-graph';

import { getGraphData, getTooltip, transformLabel } from './utils';

function ServiceMap({ fgRef, serviceMap, width }: any): JSX.Element {
	const isDarkMode = false;

	const { nodes, links } = getGraphData(serviceMap, isDarkMode);

	const graphData = { nodes, links };

	return (
		<ForceGraph2D
			ref={fgRef}
			height={500}
			width={width}
			cooldownTicks={100}
			graphData={graphData}
			linkLabel={getTooltip}
			linkColor={(d: any) => d.color}
			linkDirectionalParticles="value"
			// linkDirectionalParticleSpeed={(d: any) => {d.value}}
			nodeCanvasObject={(node: any, ctx: any) => {
				const label = transformLabel(node.id);
				const { fontSize } = node;
				ctx.font = `${fontSize}px Roboto`;
				const { width } = node;

				ctx.fillStyle = node.color;
				ctx.beginPath();
				ctx.arc(node.x, node.y, width, 0, 2 * Math.PI, false);
				ctx.fill();
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
				ctx.fillText(label, node.x, node.y);
			}}
			onLinkHover={(node: any) => {
				const tooltip = document.querySelector('.graph-tooltip');
				if (tooltip && node) {
					tooltip.innerHTML = getTooltip(node);
				}
			}}
			nodePointerAreaPaint={(node: any, color: any, ctx: any) => {
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
				ctx.fill();
			}}
		/>
	);
}

export default memo(ServiceMap);
