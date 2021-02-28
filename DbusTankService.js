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

DbusService = require('./DbusService.js');

/**********************************************************************
 * SignalkTankService implements a 'tank' class dbus service which
 * satisfies the requirements of the Venus OS and which can be used to
 * write tank data onto the bus in a format that can be used by the
 * CCGX display and other Venus OS GUIs.
 */

DEFAULT_PROPERTIES = [
  { name: "/Management/ProcessName", type: "s", value: "pdjr-signalk-sk2venus" },
  { name: "/Management/ProcessVersion", type: "s", value: "0.1" },
  { name: "/Management/Connection", type: "s", value: "Signal K" },
  { name: "ProductId", type: "s", value: "n/a" },
  { name: "ProductName", type: "s", value: "n/a" },
  { name: "FirmwareVersion", type: "s", value: "n/a" },
  { name: "HardwareVersion", type: "s", value: "n/a" },
  { name: "Connected", type: "i", value: 1 },
  { name: "Level", type: "f", value: 0.0 },
  { name: "Capacity", type: "f", value: 0.0 },
  { name: "FluidType", type: "i", value: 0 },
  { name: "Remaining", type: "f", value: 0.0 }
];

module.exports = class DbusTankService extends DbusService {

  /******************************************************************
   * Construct a new SignalkTankService instance and attempt to
   * connect to the host system dbus, throwing an exception if the
   * connection fails. Note that this constructor does not create an
   * actual dbus service for the Signal K tank identified by
   * fluidtype and tankinstance, a subsequent call to createService()
   * is required to do that.
   */
  constructor(name, instance=0, fluidtype=15) {
    console.log("DbusTankService(%s,%d,%d)...", name, instance, fluidtype);
    super("com.victronenergy.tank.signalk_" + ((name)?(name):(fluidtype + "_" + instance)));
    this.instance = instance;
    this.fluidtype = fluidtype;
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
    initialise() {
      super.initialise("tank", this.instance, DEFAULT_PROPERTIES);
      this.update("/FluidType", this.fluidtype);
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
                this.capacity = value;
                super.update(interfaceProperty.property, this.capacity);
                break;
            default:
                break;
        }
    }

}
