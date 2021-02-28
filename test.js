const DbusTankService = require('./DbusTankService');

var dbusService = new DbusTankService("mytank", 0, 5);

dbusService.initialise();
