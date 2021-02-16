# pdjr-skplugin-sk2venus

This plugin should only be used on Signal K servers running on Venus OS.

__pdjr-skplugin-sk2venus__ maps compatible Signal K paths into D-Bus
devices making data updates available in Venus OS.

At the time of writing the plugin supports Venus service classes 'gps',
'tank' and 'temperature'

The plugin borrows GUI enhancements from Kevin Windrem's
[tank repeater](https://github.com/kwindrem/SeeLevel-N2K-Victron-VenusOS)
project to achieve the display shown below, providing a specific fix
for Venus' multi-channel tank sensor problems.

![CCGX tank display](venus.png)

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


### D-Bus service definitions

This array property consists of a collection of *service definition*
items, each of which defines a single Venus system D-Bus service.
Each *service definition* has the following properties:

#### D-Bus service class

This string property defines the Venus D-Bus service class.
Choose from 'gps', 'tank' or 'temperature' to suit your requirement.

#### Signal K path

This string property defines the Signal K data path for this device and
must point to the self-relative root of an entry in the Signal K model
that returns a primary value of the type implied by your choice of
*D-Bus service class*.

For example, if you set *D-Bus service class* to 'tank', then an
appropriate value for *Signal K path* might be 'tanks.wasteWater.0'.

#### Property fiddle factors

This array property consists of a collection of *fiddle factor
definition* items, each of which defines a multiplication factor that
should be used on a value returned by Signal K before it is assigned
to a D-Bus property 

## Suported D-Bus service classes and their properties.

### tank

| Property   | Signal K key          | Default fiddle factor | Comment  |
|:-----------|:----------------------|----------------------:|:---------|
| /Level     | *path*.currentLevel   | 1.0                   |          |
| /Capacity  | *path*.capacity.value | 1.0                   |          |
| /Remaining | n/a                   | n/a                   | Computed |
| /FluidType | n/a                   | n/a                   | Derived from *path* |

## Reviewing operation in Venus OS

## Acknowledgements

Thanks to @kwindrem for making this a whole lot easier than it might have
been by designing his repeater software in a way which allows its components
to be leveraged by others.

## Author

Paul Reeve \<<preeve@pdjr.eu>\>
