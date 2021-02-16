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
const DbusService = require('./DbusService');

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

module.exports = function(app) {
    var plugin = {};
    var unsubscribes = [];

    plugin.id = PLUGIN_ID;
    plugin.name = "Signal K to Venus";
    plugin.description = "Inject Signal K data onto host dbus";

    const log = new Log(plugin.id, { ncallback: app.setPluginStatus, ecallback: app.setPluginError });

    plugin.schema = (fs.existsSync(__dirname + "/schema.json"))?JSON.parse(fs.readFileSync(__dirname + "/schema.json")):{};

    plugin.uischema = (fs.existsSync(__dirname + "/uischema.json"))?JSON.parse(fs.readFileSync(__dirname + "/uischema.json")):{};

    plugin.start = function(options) {
	if ((options) && (options.hasOwnProperty('services')) && (options.service.length > 0)) {
            log.N("creating %s D-bus services", options.services.length);
            options.services.forEach(service => {
                try {
		    let dbusService = null;
		    switch (service.class) {
		        case 'gps':
			    dbusService = new DbusGpsService(service.factor);
			    break;
		        case 'tank':
	                    var matches = service.path.matches(/^tanks\.(.*)\.(.*)$/);
			    if (matches) {
			        var instance = matches[1];
				var fluidtype = (SIGNALK_FLUID_TYPES.hasOwnProperty(matches[0]))?SIGNALK_FLUID_TYPES[matches[0]]:SIGNALK_FLUID_TYPES['undefined']; 
		                dbusService = new DbusTankService(instance, fluidtype, service.factors);
			    } else {
			        log.E("ignoring %s service with invalid Signal K path (%s)", service.class, service.path);
			    }
			    break;
			case 'temperature':
			    dbusService = new DbusTemperatureService(service.factor);
		            break;
		        default:
		            break;
		    }
                    dbusService.createService();
		    var triggerKey = dbusService.getSignalkTriggerKey();
		    var staticKeys = null;
		    if (triggerKey) {
                        var stream = app.streambundle.getSelfStream(service.path + triggerKey());
                        if (stream) {
                            unsubscribes.push(stream.onValue(currentLevel => {
                                if (staticKeys === null) {
				    staticKeys = dbusService.getSignalkStaticKeys();
				    staticKeys.forEach(key => dbusService.update(key, app.getSelfPath(service.path + key)));
				}
                                dbusService.update(null, currentLevel)
                            }));
                        }
		    }
                } catch(e)  {
                    log.E("unable to create %s service for Signal K path %s (%s)", service.class, service.path, e);
                }
	    });
        }
    }

    plugin.stop = function() {
        unsubscribes.forEach(f => f())
        unsubscribes = []
    }

    return(plugin);

}
