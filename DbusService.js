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

function createProperty(iface, name, type, value, getter, setter) {
  iface.addProperty(name, {
    type: dbus.Define(type),
    getter: getter ? createGetter(getter) : undefined,
    setter: setter ? createSetter(setter) : undefined,
  });
  return(value);
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
  constructor(servicename) {
	  console.log("DbusService(%s,%o)...", servicename, properties);
	  this.servicename = servicename;
    this.properties = properties;
    this.objectname = "/" + this.servicename.replace(/\./g, '/');
    this.interfacename = this.servicename;
    this.properties = {};

	  process.env.DISPLAY = ':0';
    process.env.DBUS_SESSION_BUS_ADDRESS = 'unix:path=/run/dbus/system_bus_socket';
  
    if (this.service = dbus.registerService('system', this.servicename)) {
		  if (this.object = this.service.createObject(this.objectname)) {
        if (this.interface = this.object.createInterface(this.interfacename)) {
          console.log("created new service %s", this.servicename);
        } else {
          throw "error creating interface";
        }
      } else {
			  throw "error creating service object";
		  }
	  } else {
		  throw "error connecting to system bus";
	  }
  }

  async initialise(klass, instance, properties) {
    this.properties['/'] = createProperty(this.interface, "/", 'v', {}, this.getPropertyTree.bind(this));
    this.properties['/DeviceInstance'] = createProperty(this.interface, '/DeviceInstance', this.getDeviceInstance(klass, instance), this.getPropertyValue.bind(this));
    properties.forEach(p => {
      this.properties[p.name] = createProperty(this.interface, p.name, p.type, p.value, this.getPropertyValue.bind(this));
    });
    this.interface.update();
  }

  getPropertyTree() {
    var retval = {};
  }

  getDeviceInstance(klass, instance) {
  }

  getPropertyValue(path) {
    return(this.properties[path]);
  }

  update(key, value) {
    if (this.properties.hasOwnPropery(key)) {
      this.properties[key] = value;
    }
    this.interface.update();
  }

}
