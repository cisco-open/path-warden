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

import { ItemType } from "antd/es/menu/hooks/useItems";
import {
	UploadOutlined,
	UserOutlined,
	VideoCameraOutlined,
} from '@ant-design/icons';
import { PathRouteProps } from "react-router-dom";
import LabelsPage from "pages/LabelsPage";
import TestPage from "pages/TestPage";
import PolicyListPage from "pages/PolicyListPage";
import PolicyEditorPage from "pages/PolicyEditorPage";

export enum ROUTES {
  HOME = '/',
  LABELS = '/labels',
	LABEL = '/labels/:name',
	POLICES_LIST = '/policy-list',
	POLICY_EDITOR = '/policy-list/:name',
}

export const MenuItems: ItemType[] = [
  // {
  //   key: ROUTES.HOME,
  //   icon: <UserOutlined />,
  //   label: 'Home',
  // },
  {
    key: ROUTES.LABELS,
    icon: <VideoCameraOutlined />,
    label: 'Label',
  },
  // {
  //   key: ROUTES.LABEL,
  //   icon: <UploadOutlined />,
  //   label: 'Test2',
  // },
  {
    key: ROUTES.POLICES_LIST,
    icon: <UserOutlined />,
    label: 'Policies',
  },
  // {
  //   key: ROUTES.POLICY_EDITOR,
  //   icon: <UserOutlined />,
  //   label: 'Test suites',
  // },
];

export const AppRoutes: PathRouteProps[] = [
  {
    path: ROUTES.HOME,
    element: <LabelsPage></LabelsPage>
  },
  {
    path: ROUTES.LABELS,
    element: <LabelsPage></LabelsPage>
  },
  {
    path: ROUTES.LABEL,
    element: <TestPage></TestPage>
  },
  {
    path: ROUTES.POLICES_LIST,
    element: <PolicyListPage></PolicyListPage>
  },
  {
    path: ROUTES.POLICY_EDITOR,
    element: <PolicyEditorPage></PolicyEditorPage>
  },
];
