/**********************************************************************
 * Copyright 2021 Paul Reeve <paul@pdjr.eu>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

const fs = require('fs');
const Log = require('./lib/signalk-liblog/Log.js');
const DbusTankService = require('./DbusTankService');

const PLUGIN_ID = "pdjr-skplugin-sk2venus";

const SIGNALK_FLUID_TYPES = {
    fuel: 0,
    freshWater: 1,
    greyWater: 2,
    liveWell: 3,
    lubrication: 4,
    wasteWater: 5,
    gasoline: 6,
    error: 14,
    unavailable: 15
};

const VENUS_GUI_FOLDER = "/opt/victronenergy/gui/qml/";
const MY_GUI_FOLDER = __dirname + "/gui/";
const GUI_FILES = [ "OverviewMobile.qml", "TileTank.qml" ];
const PLUGIN_SCHEMA_FILE = __dirname + "/schema.json";
const PLUGIN_UISCHEMA_FILE = __dirname + "/uischema.json";

module.exports = function(app) {
    var plugin = {};
    var unsubscribes = [];

    plugin.id = PLUGIN_ID;
    plugin.name = "Signal K to Venus";
    plugin.description = "Inject Signal K data onto host dbus";
    plugin.schema = (fs.existsSync(PLUGIN_SCHEMA_FILE))?JSON.parse(fs.readFileSync(PLUGIN_SCHEMA_FILE)):{};
    plugin.uischema = (fs.existsSync(PLUGIN_UISCHEMA_FILE))?JSON.parse(fs.readFileSync(PLUGIN_UISCHEMA_FILE)):{};

    const log = new Log(plugin.id, { ncallback: app.setPluginStatus, ecallback: app.setPluginError });


    plugin.start = function(options) {

        process.env.DISPLAY = ':0';
        process.env.DBUS_SESSION_BUS_ADDRESS = 'unix:path=/run/dbus/system_bus_socket';


        if (options) {

            if (options.usegui) {
                try {
                    configureGUI(options.usegui);
                } catch(e) {
                    log.E("error configuring GUI (%s)", e);
                }
            }

            if ((options.hasOwnProperty('services')) && (options.services.length > 0)) {
                log.N("creating %s Venus service%s", options.services.length, ((options.services.length == 1)?"":"s"));
                options.services.forEach(service => {
                    try {
                        let dbusService = null;
                        switch (service.class) {
                            case 'gps':
                                dbusService = new DbusGpsService(service.name);
                                break;
                            case 'tank':
                                var matches = service.path.match(/^tanks\.(.*)\.(.*)$/);
                                if (matches) {
                                    var instance = matches[2];
                                    var fluidtype = (SIGNALK_FLUID_TYPES.hasOwnProperty(matches[1]))?SIGNALK_FLUID_TYPES[matches[1]]:SIGNALK_FLUID_TYPES['undefined']; 
                                    dbusService = new DbusTankService(service.name, instance, fluidtype);
                                } else {
                                    log.E("ignoring %s service with invalid Signal K path (%s)", service.class, service.path);
                                }
                                break;
                            case 'temperature':
                                dbusService = new DbusTemperatureService(service.name);
                                break;
                            default:
                                break;
                        }
			dbusService.createService();
                        var triggerKey = dbusService.getSignalkTriggerKey();
                        var staticKeys = null;
                        if (triggerKey) {
                            var stream = app.streambundle.getSelfStream(service.path + triggerKey);
                            if (stream) {
                                unsubscribes.push(stream.onValue(currentLevel => {
                                    if (staticKeys === null) {
                                        staticKeys = dbusService.getSignalkStaticKeys();
                                        staticKeys.forEach(key => dbusService.update(key, app.getSelfPath(service.path + key)));
                                    }
                                    //dbusService.update(triggerKey, currentLevel)
                                }));
                            }
                        }
                    } catch(e)  {
                        log.E("unable to create %s service for Signal K path %s (%s)", service.class, service.path, e);
                    }
                });
            }
        }
    }

    plugin.stop = function() {
        unsubscribes.forEach(f => f())
        unsubscribes = []
    }

   /******************************************************************
     * If yesno, then backup the extant system GUI files and copy our
     * versions of GUI_FILES into VENUS_GUI_FOLDER if they aren't there
     * already. Otherwise replace them with any previously made
     * backups.
     */

    function configureGUI(yesno) {
        if (fs.existsSync(VENUS_GUI_FOLDER)) {
            if (yesno) {
                GUI_FILES.forEach(file => {
                    if (!fs.existsSync(VENUS_GUI_FOLDER + file + ".orig")) {
                        if (fs.existsSync(VENUS_GUI_FOLDER + file)) {
                            fs.renameSync(VENUS_GUI_FOLDER + file, VENUS_GUI_FOLDER + file + ".orig");
                        }
                    }
                    fs.copyFileSync(MY_GUI_FOLDER + file, VENUS_GUI_FOLDER + file);
                });
            } else {
                GUI_FILES.forEach(file => {
                    if (fs.existsSync(VENUS_GUI_FOLDER + file + ".orig")) {
                        fs.renameSync(VENUS_GUI_FOLDER + file + ".orig", VENUS_GUI_FOLDER + file);
                    }
                });
            }
        } else {
            throw "Venus GUI folder not found - are you running on Venus OS?"
        }
    }

    return(plugin);

}
