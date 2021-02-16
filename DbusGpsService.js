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

/**********************************************************************
 * SignalkTankService implements a 'tank' class dbus service which
 * satisfies the requirements of the Venus OS and which can be used to
 * write tank data onto the bus in a format that can be used by the
 * CCGX display and other Venus OS GUIs.
 */
module.exports = class DbusService {

    /******************************************************************
     * Construct a new SignalkTankService instance and attempt to
     * connect to the host system dbus, throwing an exception if the
     * connection fails. Note that this constructor does not create an
     * actual dbus service for the Signal K tank identified by
     * fluidtype and tankinstance, a subsequent call to createService()
     * is required to do that.
     */
    constructor(fluidtype, tankinstance, factor=1.0) {
        this.fluidtype = fluidtype;
        this.tankinstance = tankinstance;
        this.factor = factor;
        this.tankcapacity = 0.0;
        this.servicename = "com.victronenergy.tank.signalk_tank_" + this.fluidtype + "_" + this.tankinstance;
        this.interfacename = this.servicename;
        this.objectpath = this.servicename.replace(/\./g, '/');
        this.bus = dbus.systemBus();
        this.ifacedesc = null;
        this.iface = null;
        if (!this.bus) throw "error connecting to system bus";
    }

    /******************************************************************
     * createService() attempts to asynchronously instantiate and
     * initialise a dbus service for this tank. The service is
     * configured in a way which satisfies the requirements of Venus OS.
     * An exception is thrown on error.
     */
    createService() {
        if (this.bus) {
            this.bus.requestName(this.servicename, 0x4, function (err, retcode) {
                if ((err) || (retcode !== 1)) {
                    throw "service creation failed (" + (err)?err:retcode + ")";
                } else {
                    this.ifacedesc = {
                        name: this.interfacename,
                        properties: {
                            '/Mgmt/ProcessName': 's',
                            '/Mgmt/ProcessVersion': 's',
                            '/Mgmt/Connection': 's',
                            '/DeviceInstance': 'i',
                            '/ProductId': 's',
                            '/ProductName': 's',
                            '/FirmwareVersion': 's',
                            '/HardwareVersion': 's',
                            '/Connected': 'i',
                            '/Level': 'i',
                            '/FluidType': 'i',
                            '/Capacity': 'f',
                            '/Remaining': 'f'
                        }
                    };
                    this.iface = {
                        '/Mgmt/ProcessName': 'Signal K',
                        '/Mgmt/ProcessVersion': 'Not defined',
                        '/Mgmt/Connection': 'Signal K plugin',
                        '/DeviceInstance': this.tankinstance,
                        '/ProductId': 'venus-tanks',
                        '/ProductName': 'pdjr-skplugin-venus-tanks',
                        '/FirmwareVersion': 'n/a',
                        '/HardwareVersion': 'n/a',
                        '/Connected': 1,
                        '/Level': 0,
                        '/FluidType': this.fluidtype,
                        '/Capacity': this.tankcapacity,
                        '/Remaining': 0
                    };
                    this.bus.exposeInterface(this.iface, this.objectpath, this.ifacedesc); 
                }
            }.bind(this));
        } else {
            throw "not connected to system bus";
        }
    }
            
    /******************************************************************
     * update(currentlevel[, capacity]) updates the dbus service for
     * this tank from the supplied data.
     */
    update(currentlevel, capacity=null) {
        if ((this.bus) && (this.iface)) {
            if (capacity) {
                this.tankcapacity = (capacity * this.factor);
                this.iface['/Capacity'] = this.tankcapacity;
            }
            if (this.tankcapacity) {
                this.iface['/Remaining'] = (this.tankcapacity * currentlevel);
            }
            this.iface['/Level'] = Math.round(currentlevel * 100);
        }
    }

}
