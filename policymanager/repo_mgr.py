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
import git
from git import Repo, Git
from policy_mgr import get_policy_file_path

GIT_USER_NAME = os.environ.get("GIT_USER_NAME")
GIT_USER_EMAIL = os.environ.get("GIT_USER_EMAIL")
GIT_URL = os.environ.get("GIT_URL")
REPOSITORY_PATH = os.environ.get("REPOSITORY_PATH")
REPOSITORY_URL = f"git@{GIT_URL}:{REPOSITORY_PATH}.git"
REPOSITORY_DEST = "/app/policies"

_SSH_CONFIG_COMMANDS = [
    'mkdir ~/.ssh',
    'cp policyrepo.pk ~/.ssh/policyrepo.pk',
    'cp config ~/.ssh/config',
    f'ssh-keyscan {GIT_URL}> keyscan',
    'echo "$(cat keyscan)" >> ~/.ssh/known_hosts',
]

_GIT_CONFIG_COMMANDS = [
    'git config --global user.name johndoe',
    'git config --global user.email johndoe@john.doe'
]


def _init_ssh_config():
    for COMMAND in _SSH_CONFIG_COMMANDS:
        os.system(COMMAND)

def _init_git_config():
    for COMMAND in _GIT_CONFIG_COMMANDS:
        os.system(COMMAND)

def init_repo():
    _init_ssh_config()
    _init_git_config()
    py_git_clone()


def py_git_clone():
    global REPOSITORY_OBJ
    git_ssh_identity_file = os.path.join(os.getcwd(),'policyrepo.pk')
    git_ssh_cmd = 'ssh -i %s' % git_ssh_identity_file

    with Git().custom_environment(GIT_SSH_COMMAND=git_ssh_cmd):
        REPOSITORY_OBJ = Repo.clone_from(url=REPOSITORY_URL, to_path=REPOSITORY_DEST, branch='master')

    return REPOSITORY_OBJ


def git_add(policy: str):
    global REPOSITORY_OBJ

    print("git_add: start")

    policy_file_path = get_policy_file_path(policy=policy)
    REPOSITORY_OBJ.index.add(policy_file_path)

    print("git_add: end")


def git_remove(policy: str):
    global REPOSITORY_OBJ

    print("git_remove: start")

    policy_file_path = get_policy_file_path(policy=policy)
    REPOSITORY_OBJ.index.remove(policy_file_path)

    print("git_remove: end")


def git_commit():
    global REPOSITORY_OBJ

    print("git_commit: start")

    REPOSITORY_OBJ.git.commit('-m', 'UI Commit', author='anmanea <anmanea@cisco.com>')

    print("git_commit: end")

def git_push():
    global REPOSITORY_OBJ

    print("git_push: start")

    origin = REPOSITORY_OBJ.remote(name='origin')
    origin.push()

    print("git_push: end")
