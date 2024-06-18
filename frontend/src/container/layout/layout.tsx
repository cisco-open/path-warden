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

import { Button, Layout, Menu, MenuProps, theme } from "antd";
import Sider from "antd/es/layout/Sider";
import { Header, Content } from "antd/es/layout/layout";
import { ReactNode, useCallback, useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { MenuItems } from "const/ROUTES";


type Props = {
  children?: ReactNode;
}

interface LayoutAppProp extends Props {
}

function LayoutApp({children}: LayoutAppProp) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const { pathname } = useLocation();
  let navigate = useNavigate();

  const onClickHandler = useCallback(
		(key: string) => {

			if (pathname !== key) {
        navigate(key);
			}
		},
		[navigate, pathname],
	);

	const onClickMenuHandler: MenuProps['onClick'] = (e) => {
		onClickHandler(e.key);
	};
  
	return (
		<Layout>
			<Sider trigger={null} collapsible collapsed={collapsed}>
				<div className="demo-logo-vertical" />
				<Menu
					theme="dark"
					mode="inline"
					defaultSelectedKeys={['1']}
					items={MenuItems}
          onClick={onClickMenuHandler}
				/>
			</Sider>
			<Layout>
				<Header style={{ padding: 0, background: colorBgContainer }}>
					<Button
						type="text"
						icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
						onClick={() => setCollapsed(!collapsed)}
						style={{
							fontSize: '16px',
							width: 64,
							height: 64,
						}}
					/>
				</Header>
				<Content
					style={{
						margin: '24px 16px',
						padding: 24,
						minHeight: 280,
						background: colorBgContainer,
						borderRadius: borderRadiusLG,
						overflow: 'auto'
					}}
				>
					{children}
				</Content>
			</Layout>
		</Layout>
	);
}

export default LayoutApp;
