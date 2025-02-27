/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
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
 */

import { Pagination } from '@alfresco/js-api';

export class IdentityUserModel {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    createdTimestamp?: any;
    emailVerified?: boolean;
    enabled?: boolean;

    constructor(obj?: any) {
        if (obj) {
            this.id = obj.id || null;
            this.firstName = obj.firstName || null;
            this.lastName = obj.lastName || null;
            this.email = obj.email || null;
            this.username = obj.username || null;
            this.createdTimestamp = obj.createdTimestamp || null;
            this.emailVerified = obj.emailVerified || null;
            this.enabled = obj.enabled || null;
        }
    }
}

export class IdentityUserPasswordModel {

    type: string;
    value: string;
    temporary: boolean;

    constructor(obj?: any) {
        if (obj) {
            this.type = obj.type;
            this.value = obj.value;
            this.temporary = obj.temporary;
        }
    }
}

export interface IdentityUserQueryResponse {

    entries: IdentityUserModel[];
    pagination: Pagination;
}

export class IdentityUserQueryCloudRequestModel {

    first: number;
    max: number;

    constructor(obj?: any) {
        if (obj) {
            this.first = obj.first;
            this.max = obj.max;
        }
    }
}

export class IdentityJoinGroupRequestModel {

    realm: string;
    userId: string;
    groupId: string;

    constructor(obj?: any) {
        if (obj) {
            this.realm = obj.realm;
            this.userId = obj.userId;
            this.groupId = obj.groupId;
        }
    }
}
