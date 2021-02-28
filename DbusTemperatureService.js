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

dbus = require('dbus-native');
DbusService = require('./DbusService.js');

module.exports = class DbusTemperatureService extends DbusService {

    constructor(name, instance=0) {
        if (name) {
            super(
	        "com.victronenergy.temperature.signalk_" + name);
                [
                    { "property": "Temperature",    "type": "f", "initial": 0.0, "signalkKey": ".value" },
                    { "property": "DeviceInstance", "type": "i", "initial": this.instance }
                ]
            );
        } else {
            throw "service name must be specified";
        } 
    }

    getSignalkTriggerKey() {
        return(this.interfaceProperties[0].signalkKey);
    }

    getSignalkStaticKeys() {
        return(this.interfaceProperties.slice(1).filter(p => (p.hasOwnProperty('signalkKey'))).map(p => p.signalkKey));
    }

    createService() {
        super.createService(
            this.interfaceProperties.reduce((a,v) => { a[v.property] = v.type; return(a); }, {}),
            this.interfaceProperties.reduce((a,v) => { a[v.property] = v.initial; return(a); }, {})
        );
    }
            
    update(key, value) {
        var interfaceProperty = this.interfaceProperties.reduce((a,v) => { if (v.signalkKey == key) { return(v); } else { return(a) }}, null);
        switch (interfaceProperty.property) {
            case "/Temperature":
                super.update(interfaceProperty.property, (value - 273 ));
                break;
            default:
                break;
        }
    }

}
