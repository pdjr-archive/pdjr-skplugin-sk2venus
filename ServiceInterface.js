/**********************************************************************
 * Copyright 2021 Paul Reeve <paul@pdjr.eu>
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You
 * may not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

const dbus = require('dbus-next');
const { Interface } = dbus.interface;

module.exports = class ServiceInterface extends Interface {
        constructor(name) {
		super(name);
		this._level = 0.0;
		this._capacity = 0.0;
	}

	get Level() {
		console.log("get Level()...");
		return(this._level);
	}

	get Capacity() {
		console.log("get Capacity()...");
		return(this._capacity);
	}

}
