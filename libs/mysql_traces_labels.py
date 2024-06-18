# Copyright 2024 Cisco Systems, Inc. and its affiliates
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0

import os
from flaskext.mysql import MySQL
from functools import wraps
from .lineage_propagation import *


def init_mysql(app):
    mysql = MySQL()
    app.config["MYSQL_DATABASE_USER"] = "root"
    app.config["MYSQL_DATABASE_PASSWORD"] = os.getenv("db_root_password")
    app.config["MYSQL_DATABASE_DB"] = os.getenv("db_name")
    app.config["MYSQL_DATABASE_HOST"] = os.getenv("MYSQL_SERVICE_HOST")
    app.config["MYSQL_DATABASE_PORT"] = int(os.getenv("MYSQL_SERVICE_PORT"))
    mysql.init_app(app)

    return mysql


def init_services_labels(mysql: MySQL):
    service = os.getenv("SERVICE_NAME")

    connector = mysql.connect()
    cursor = connector.cursor()

    query = "INSERT IGNORE INTO services(service) " \
            "values(%s)"
    data = (service)

    cursor.execute(query, data)
    connector.commit()

    label = os.getenv("service_label")

    query = "INSERT IGNORE INTO labels(label) " \
            "values(%s)"
    data = (label)

    cursor.execute(query, data)
    connector.commit()

    query = "INSERT IGNORE INTO services_labels(service, label) " \
            "values(%s, %s)"
    data = (service, label)

    cursor.execute(query, data)
    connector.commit()

    cursor.close()
    connector.close()


def save_trace_to_db(mysql: MySQL):
    """
    Decorator used to store trace_id's and the services its request follows by consecutive calls.
    """
    def inner(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_span_context = trace.get_current_span().get_span_context()
            trace_id = current_span_context.trace_id
            trace_id = trace.span.format_trace_id(trace_id)

            connector = mysql.connect()
            cursor = connector.cursor()

            query = "INSERT IGNORE INTO traces(trace) " \
                    "values(%s)"
            data = (trace_id)

            cursor.execute(query, data)
            connector.commit()

            label = os.getenv("service_label")

            query = "INSERT IGNORE INTO traces_labels(trace, label) " \
                    "values(%s, %s)"
            data = (trace_id, label)

            cursor.execute(query, data)
            connector.commit()

            cursor.close()
            connector.close()

            res = func(*args, **kwargs)

            return res
        return wrapper
    return inner


def manage_request_labels(mysql: MySQL):
    """
    Decorator to track propagated lineage (request) labels between parent-child services,
    by storing data into the parent_child_labels table within the database.
    If there is no entry yet for the parent-child pair, it will create one.
    """
    def inner(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            parent = get_header_from_flask_request("serviceparent")

            if parent:
                parent = parent[0]
                child = os.getenv("SERVICE_NAME")
                lineage_label_set = get_lineage_label_set()
                print("manage_request_labels:lineage_label_set:", lineage_label_set)
                if not lineage_label_set:
                    labels = []
                else:
                    labels = json.loads(lineage_label_set)["LabelSet"]
                labels_string = ','.join(labels)

                print("manage_request_labels:request_labels:", labels)

                connector = mysql.connect()
                cursor = connector.cursor()

                query = 'SELECT EXISTS(SELECT 1 FROM parent_child_labels WHERE parent=%s AND child=%s)'
                data = (parent, child)

                cursor.execute(query, data)
                exists = cursor.fetchone()[0]

                if not exists:
                    print("manage_request_labels:notexists")
                    query = 'INSERT INTO parent_child_labels(parent, child, request_labels) ' \
                            'VALUES(%s, %s, %s)'
                    data = (parent, child, labels_string)
                else:
                    print("manage_request_labels:exists")
                    query = 'SELECT request_labels FROM parent_child_labels ' \
                            'WHERE parent=%s AND child=%s'
                    data = (parent, child)

                    cursor.execute(query, data)
                    result = cursor.fetchone()[0]

                    print("manage_request_labels:result:", result)

                    result_list = result.split(',')

                    print("manage_request_labels:result_list:", result_list)

                    labels_result_diff = [label for label in labels if label not in result_list]

                    if labels_result_diff:
                        query = 'UPDATE parent_child_labels ' \
                                'SET request_labels=%s ' \
                                'WHERE parent=%s AND child=%s'
                        data = (labels_string, parent, child)

                cursor.execute(query, data)
                connector.commit()

                cursor.close()
                connector.close()

                set_request_lineage_baggage(labels=labels_string)
                set_request_lineage_attribute()

                res = func(*args, **kwargs)

            else:
                res = func(*args, **kwargs)

            return res
        return wrapper
    return inner


def manage_response_labels(mysql: MySQL):
    """
    Decorator to track propagated response labels between parent-child services,
    by storing data into the parent_child_labels table within the database.
    The direction of these labels propagation is in reverse (child-parent).

    ToDo: Response Labels propagation (not via headers if possible)
    """
    def inner(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            res = func(*args, **kwargs)

            if "X-Response-Labels" in res.headers:
                print("/manage_response_labels:Res.headers:", res.headers)
                labels = res.headers.get("X-Response-Labels")

                parent = get_header_from_flask_request("serviceparent")
                if parent:
                    parent = parent[0]
                    child = os.getenv("SERVICE_NAME")

                    query = 'SELECT response_labels FROM parent_child_labels ' \
                            'WHERE parent=%s AND child=%s'
                    data = (parent, child)

                    connector = mysql.connect()
                    cursor = connector.cursor()

                    cursor.execute(query, data)
                    result = cursor.fetchone()[0]

                    result_list = [] if not result else result.split(',')

                    labels_list = labels.split(',')
                    for label in labels_list:
                        if label not in result_list:
                            result_list.append(label)

                    labels_string = ','.join(result_list)

                    query = 'UPDATE parent_child_labels ' \
                            'SET response_labels=%s ' \
                            'WHERE parent=%s AND child=%s'
                    data = (labels_string, parent, child)

                    cursor.execute(query, data)
                    connector.commit()

                    cursor.close()
                    connector.close()

                set_response_lineage_baggage(labels=labels)
                set_response_lineage_attribute()

            return res
        return wrapper
    return inner

# Test purpose only
def register_service_as_db(mysql: MySQL):
    service = os.getenv("SERVICE_NAME")

    connector = mysql.connect()
    cursor = connector.cursor()

    query = "UPDATE services " \
            "SET is_db=1 " \
            "WHERE service=%s"
    data = (service)

    cursor.execute(query, data)
    connector.commit()

    cursor.close()
    connector.close()

def register_policy_violation(mysql: MySQL, policy: str):
    connector = mysql.connect()
    cursor = connector.cursor()

    parent = get_header_from_flask_request("serviceparent")
    child = os.getenv("SERVICE_NAME")

    query = 'UPDATE parent_child_labels ' \
            'SET policy_violation=%s ' \
            'WHERE parent=%s AND child=%s'
    data = (policy, parent, child)

    cursor.execute(query, data)
    connector.commit()

    cursor.close()
    connector.close()

def remove_policy_violation(mysql: MySQL):
    connector = mysql.connect()
    cursor = connector.cursor()

    parent = get_header_from_flask_request("serviceparent")
    child = os.getenv("SERVICE_NAME")

    query = 'UPDATE parent_child_labels ' \
            'SET policy_violation=%s ' \
            'WHERE parent=%s AND child=%s'
    data = (None, parent, child)

    cursor.execute(query, data)
    connector.commit()

    cursor.close()
    connector.close()