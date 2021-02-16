# pdjr-skplugin-sk2venus

This plugin should only be used on Signal K servers running on Venus OS.

__pdjr-skplugin-sk2venus__ makes Signal K data available in Venus.

At the time of writing the plugin supports Venus service classes 'gps',
'tank' and 'temperature'

This project derives from an effort to create tank services in Venus from
tank data in Signal K as a work-around for Venus' broken support for CAN
connected multi-channel tank monitoring devices.
Solving this original problem required some GUI enhancements to allow the
display of multiple tanks and was achieved by borrowing from Kevin Windrem's
[tank repeater](https://github.com/kwindrem/SeeLevel-N2K-Victron-VenusOS)
project.
The GUI updates are carried over here, so if you use this project to inject
tank data into Venus, then you get the bonus of being able to display it
[quite nicely](venus.png) on the Venus GUI.

## System requirements

A host system running Signal K under Venus OS.

## Installation

Download and install __pdjr-skplugin-sk2venus__ using the _Appstore_
link in your Signal K Node server console.
The plugin can also be obtained from the 
[project homepage](https://github.com/preeve9534/pdjr-skplugin-sk2venus)
and installed using
[these instructions](https://github.com/SignalK/signalk-server-node/blob/master/SERVERPLUGINS.md).

Once installed, you must configure the plugin and enable its operation
in Signal K.

## Configuration

Login to your Signal K dashboard and navigate to
_Server->Plugin Config_->_Venus tanks_ and select the _Configure_
to open the configuration panel and reveal the following options.

### Use GUI enhancements?

This boolean property determines whether or not to apply the GUI
enhancements that support rendering of multiple tanks in the Venus
GUI.
If your not bothered about rendering tank data then leave unchecked.

### Service definitions

This array property consists of a collection of *service definition*
items, each of which specifies a single Venus system service.
Each *service definition* has the following properties:

#### Service class

This required string property defines the Venus service class.
Choose from 'gps', 'tank' or 'temperature' to suit your requirement.

#### Service name

This string property supplies a value that will be used to construct
the Venus service name.
A value is required for services in classes 'gps' and 'temperature'
and optional for service class 'tank'.
In this latter case if no name value is supplied then one will be
constructed of the form '*fluidtype*\_*tankinstance*'.

However a value for service name is arrived at, the resulting Venus
service name will take the form:

'com.victronenergy.*class*.signalk\_*server-ip-address*\_*server-port*\_*name*'

#### Signal K path

This string property defines the Signal K data path which forms the
basis of this service and must point to an entry in the Signal K
'self' model that returns a primary value of the type implied by your
choice of *Service class*.

For example, if you set *Service class* to 'tank', then an appropriate
value for *Signal K path* might be 'tanks.wasteWater.0'.

#### Property fiddle factors

This array property consists of a collection of *fiddle factor
definition* items, each of which defines a multiplication factor that
should be used on a value returned by Signal K before it is assigned
to a service data property.

## Suported service classes and their properties.

### gps

| Property           | Signal K key          | Default fiddle factor | Comment  |
|:-------------------|:----------------------|----------------------:|:---------|
| Fix                | *path*.value          | 1.0                   |          |
| Position/Latitude  | *path*.value          | 1.0                   |          |
| Position/Longitude | *path*.value          | 1.0                   |          |
| MagneticVariation  | *path*.value          | 1.0                   |          |
| Speed              | *path*.value          | 1.0                   |          |
| Course             | *path*.value          | 1.0                   |          |
| Altitude           | *path*.value          | 1.0                   |          |
| NrOfSatellites     | *path*.value          | 1.0                   |          |
| UtcTimestamp       | *path*.value          | 1.0                   |          |

### tank

| Property           | Signal K key          | Default fiddle factor | Comment  |
|:-------------------|:----------------------|----------------------:|:---------|
| Level              | *path*.currentLevel   | 1.0                   |          |
| Capacity           | *path*.capacity.value | 1.0                   |          |
| Remaining          | n/a                   | n/a                   | Computed |
| FluidType          | n/a                   | n/a                   | Derived from *path* |

### temperature

| Property           | Signal K key          | Default fiddle factor | Comment  |
|:-------------------|:----------------------|----------------------:|:---------|
| Temperature        | *path*.value          | 1.0                   |          |





## Reviewing operation in Venus OS

## Acknowledgements

Thanks to @kwindrem for making this a whole lot easier than it might have
been by designing his repeater software in a way which allows its components
to be leveraged by others.

## Author

Paul Reeve \<<preeve@pdjr.eu>\>
