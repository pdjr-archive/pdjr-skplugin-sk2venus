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

/**********************************************************************
 * SignalkTankService implements a 'tank' class dbus service which
 * satisfies the requirements of the Venus OS and which can be used to
 * write tank data onto the bus in a format that can be used by the
 * CCGX display and other Venus OS GUIs.
 */
module.exports = class DbusTankService extends DbusService {

    /******************************************************************
     * Construct a new SignalkTankService instance and attempt to
     * connect to the host system dbus, throwing an exception if the
     * connection fails. Note that this constructor does not create an
     * actual dbus service for the Signal K tank identified by
     * fluidtype and tankinstance, a subsequent call to createService()
     * is required to do that.
     */
    constructor(tankinstance, fluidtype, factors) {
        super("com.victronenergy.tank.signalk_" + fluidtype + "_" + tankinstance);
        this.tankinstance = tankinstance;
        this.fluidtype = fluidtype;
        this.capacity = 0.0;
        this.remaining = 0.0;
        this.factors = factors;
        this.interfaceProperties = [
            { "property": "/Level",     "type": "f", "initial": 0.0, "signalkKey": ".currentLevel", "factor": 100 },
            { "property": "/Capacity",  "type": "f", "initial": 0.0, "signalkKey": ".capacity.value" },
            { "property": "/Remaining", "type": "f", "initial": 0.0  },
            { "property": "/FluidType", "type": "i", "initial": this.fluidtype },
            { "property": "/DeviceInstance", "type": "i", "initial": this.tankinstance }
        ]
    }

    getSignalkTriggerKey() {
        return(this.interfaceProperties[0].signalkKey);
    }

    getSignalkStaticKeys() {
        return(this.interfaceProperties.slice(1).filter(p => (p.hasOwnProperty('signalkKey'))).map(p => p.signalkKey));
    }

    /******************************************************************
     * createService() attempts to asynchronously instantiate and
     * initialise a dbus service for this tank. The service is
     * configured in a way which satisfies the requirements of Venus OS.
     * An exception is thrown on error.
     */
    createService() {
        super.createService(
            this.interfaceProperties.reduce((a,v) => { a[v.property] = v.type; return(a); }, {}),
            this.interfaceProperties.reduce((a,v) => { a[v.property] = v.initial; return(a); }, {})
        );
    }
            
    /******************************************************************
     * update(currentlevel[, capacity]) updates the dbus service for
     * this tank from the supplied data.
     */
    update(key, value) {
        var interfaceProperty = this.interfaceProperties.reduce((a,v) => { if (v.signalkKey == key) { return(v); } else { return(a) }}, null);
        switch (interfaceProperty.property) {
            case "/Level":
                super.update("/Remaining", (this.capacity * value));
                super.update(interfaceProperty.property, (value * interfaceProperty.factor));
                break;
            case "/Capacity":
                this.capacity = (value * interfaceProperty.factor);
                super.update(interfaceProperty.property, this.capacity);
                break;
            default:
                break;
        }
    }

}
