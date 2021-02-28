const dbus = require('dbus');

const SERVICE_NAME = 'br.org.cesar.knot1';
const SETTINGS_INTERFACE_NAME = 'br.org.cesar.knot1.Settings';
const SETTINGS_OBJECT_PATH = '/br/org/cesar/knot1/Settings';

function createDBusError(error) {
  return new dbus.Error(`${SERVICE_NAME}.${error.name}`, error.message);
}

async function executeMethod(done, method, ...args) {
  try {
    const result = await method(...args);
    done(null, result);
  } catch (e) {
    const dbusErr = createDBusError(e);
    done(dbusErr);
  }
}

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

module.exports = class DBusSettingsServer {
  constructor(settingsApi) {
    this.settingsApi = settingsApi;
  }

  async start() {
    // Required by the dbus package to get the system bus
    process.env.DISPLAY = ':0';
    process.env.DBUS_SESSION_BUS_ADDRESS = 'unix:path=/run/dbus/system_bus_socket';

    const service = dbus.registerService('system', SERVICE_NAME);
    const object = service.createObject(SETTINGS_OBJECT_PATH);
    await this.createSettingsInterface(object);
  }

  async createSettingsInterface(object) {
    const settingsInterface = object.createInterface(SETTINGS_INTERFACE_NAME);

    createProperty(
      settingsInterface,
      'Ready',
      Boolean,
      this.settingsApi.isReady.bind(this.settingsApi),
    );

    createProperty(
      settingsInterface,
      'Cloud',
      Object,
      this.settingsApi.getCloud.bind(this.settingsApi),
      this.settingsApi.setCloud.bind(this.settingsApi),
    );

    createProperty(
      settingsInterface,
      'User',
      Object,
      this.settingsApi.getUser.bind(this.settingsApi),
      this.settingsApi.setUser.bind(this.settingsApi),
    );

    createProperty(
      settingsInterface,
      'Gateway',
      Object,
      this.settingsApi.getGateway.bind(this.settingsApi),
      this.settingsApi.setGateway.bind(this.settingsApi),
    );

    settingsInterface.update();
  }
}

