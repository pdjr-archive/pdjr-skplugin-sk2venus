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

dbus = require('dbus');

let ServiceInterface = require('./ServiceInterface.js');

/**********************************************************************
 * SignalkTankService implements a 'tank' class dbus service which
 * satisfies the requirements of the Venus OS and which can be used to
 * write tank data onto the bus in a format that can be used by the
 * CCGX display and other Venus OS GUIs.
 */

function createGetter(getterImpl) {
  return async (done) => {
    await executeMethod(done, getterImpl);
  };
}

function createSetter(setterImpl) {
  return async (value, done) => {
    await executeMethod(done, setterImpl, value);
  };
}

function createProperty(iface, name, type, getter, setter) {
  iface.addProperty(name, {
    type: dbus.Define(type),
    getter: getter ? createGetter(getter) : undefined,
    setter: setter ? createSetter(setter) : undefined,
  });
}

module.exports = class DbusService {

    /******************************************************************
     * Construct a new SignalkTankService instance and attempt to
     * connect to the host system dbus, throwing an exception if the
     * connection fails. Note that this constructor does not create an
     * actual dbus service for the Signal K tank identified by
     * fluidtype and tankinstance, a subsequent call to createService()
     * is required to do that.
     */
    constructor(servicename, properties) {
	console.log("DbusService(%s,%o)...", servicename, properties);
	this.servicename = servicename;
        this.properties = properties;
    	this.objectname = "/" + this.servicename.replace(/\./g, '/');
	this.interfacename = this.servicename;

	process.env.DISPLAY = ':0';
    	process.env.DBUS_SESSION_BUS_ADDRESS = 'unix:path=/run/dbus/system_bus_socket';
	this.service = dbus.registerService('system', this.servicename);
	if (this.service) {
		this.object = this.service.createObject(this.objectname);
		if (!this.object) {
			throw "error creating service object";
		}
	} else {
		if (!this.service) throw "error connecting to system bus";
	}
    }

    async createService() {
        console.log("DbusService.createService()...");
	const settings = this.object.createInterface(this.interfacename);
	console.log("Got interface %s", JSON.stringify(settings));
	createProperty(settings, '/Mgmt/ProcessName', String, function() { return(''); });
	createProperty(settings, '/Mgmt/ProcessVersion', String, function() { return(''); });
	createProperty(settings, '/Mgmt/Connection', String, function() { return(''); });
	createProperty(settings, '/DeviceInstance', Number, function() { return(11); });
	createProperty(settings, '/ProductId', String, function() { return('11'); });
	createProperty(settings, '/ProductName', String, function() { return(''); });
	createProperty(settings, '/FirmwareVersion', String, function() { return(''); });
	createProperty(settings, '/HardwareVersion', String, function() { return(''); });
	createProperty(settings, '/Connected', Number, function() { return(0); });
	settings.update();
    }

    /******************************************************************
     * createService() attempts to asynchronously instantiate and
     * initialise a dbus service for this tank. The service is
     * configured in a way which satisfies the requirements of Venus OS.
     * An exception is thrown on error.
     */
            
    /******************************************************************
     * update(currentlevel[, capacity]) updates the dbus service for
     * this tank from the supplied data.
     */
    update(property, value) {
        if ((this.bus) && (this.iface)) {
            this.iface[property] = value;
        }
    }

}
