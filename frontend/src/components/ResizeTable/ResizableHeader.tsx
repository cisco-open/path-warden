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

import { SyntheticEvent, useMemo } from 'react';
import { Resizable, ResizeCallbackData } from 'react-resizable';

import { enableUserSelectHack } from './config';
import { SpanStyle } from './styles';

function ResizableHeader(props: ResizableHeaderProps): JSX.Element {
	const { onResize, width, ...restProps } = props;

	const handle = useMemo(
		() => (
			<SpanStyle
				className="react-resizable-handle"
				onClick={(e): void => e.stopPropagation()}
			/>
		),
		[],
	);

	if (!width) {
		// eslint-disable-next-line react/jsx-props-no-spreading
		return <th {...restProps} />;
	}

	return (
		<Resizable
			width={width}
			height={0}
			handle={handle}
			onResize={onResize}
			draggableOpts={enableUserSelectHack}
		>
			{/* eslint-disable-next-line react/jsx-props-no-spreading */}
			<th {...restProps} />
		</Resizable>
	);
}

interface ResizableHeaderProps {
	onResize: (e: SyntheticEvent<Element>, data: ResizeCallbackData) => void;
	width: number;
}

export default ResizableHeader;
