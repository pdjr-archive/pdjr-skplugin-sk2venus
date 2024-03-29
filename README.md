# pdjr-skplugin-sk2venus

__pdjr-skplugin-sk2venus__ makes selected data from a Signal K server
running under Venus OS available as Venus services.
The plugin supports Venus service classes 'gps', 'tank' and 'temperature'.

## System requirements

A Venushost system running
[Signal K](https://github.com/SignalK/signalk-server/blob/master/README.md)
and
[dbus-mqtt](https://github.com/victronenergy/dbus-mqtt/blob/master/README.md)
under Venus OS.

## Operating principle

__pdjr-skplugin-sk2venus__ includes a small Python daemon which mediates

__pdjr-skplugin-sk2venus__ processes a collection of *service definitions*
into an equivalent collection of Venus services.

Each service definition supplies a Venus service *class* name (one of
'tank', 'temperature' or 'gps') and a *path* which specifies the
primary Signal K data value that contributes to service updates.

In most situations a service definition must also supply a *name* that
uniquely identifies a service within its class (in the case of 'tank'
services a meaningful unique serviceid can be automatically constructed
by the plugin). 

Services created by the plugin are assigned a Venus service name
of the form: 'com.victronenergy.*class*.signalk\_*name*'.
 
The following discussion gives an overwiew of the characteristics of
each type of service supported by the plugin and illustrates how an
instance of each service might be defined.

### temperature services

| Service property   | Signal K key          | Comment                          |
|:-------------------|:----------------------|:---------------------------------|
| Temperature        | *path*.value          | Signal K value - 273             |

Temperature values are widely distributed in Signal K with no group
structuring principle.
This means that you *must* supply a unique name for every temperature
service you create.
For example:

| Item               | Value                                                    |
|:-------------------|:---------------------------------------------------------|
| *class*            | 'temperature'                                            |
| *name*             | 'seawater'                                               |
| *path*             | 'environment.water.temperature'                          |
| service name       | 'com.victronenergy.temperature.signalk\_seawater'        |

### tank services

| Service property   | Signal K key          | Comment                          |
|:-------------------|:----------------------|:---------------------------------|
| Level              | *path*.currentLevel   | Signal K value * 100             |
| Capacity           | *path*.capacity.value | Signal K value                   |
| Remaining          | n/a                   | Computed from Level and Capacity |
| FluidType          | n/a                   | Decoded from *path*              |

Tank data in Signal K is structured under a path which encodes both
fluid type and instance number.
This structuring principle made some assumptions about data originating
from N2K, but in this instance (excuse the pun) it's useful to us and
allows a value for *name* to be generated automatically as
'*fluidtype*\_*instance*'.
For example.

| Item               | Value                                                    |
|:-------------------|:---------------------------------------------------------|
| *class*            | 'temperature'                                            |
| *path*             | 'tanks.wasteWater.0'                                     |
| service name       | 'com.victronenergy.tanks.signalk\_5\_0'                  |

### gps services

| Service property   | Signal K key           | Comment                         |
|:-------------------|:-----------------------|:--------------------------------|
| Fix                |                        |                                 |
| Position/Latitude  | *path*.value.latitude  | Signal K value                  |
| Position/Longitude | *path*.value.longitude | Signal K value                  |
| MagneticVariation  |                        |                                 |
| Speed              |                        |                                 |
| Course             |                        |                                 |
| Altitude           |                        |                                 |
| NrOfSatellites     |                        |                                 |
| UtcTimestamp       |                        |                                 |

Note that position data in Signal K need not necessarily derive from
GPS although it probably always does.

The following example uses consolidated position data to create a
Venus service.

| Item               | Value                                                    |
|:-------------------|:---------------------------------------------------------|
| *class*            | 'gps'                                                    |
| *name*             | 'consolidated'                                           |
| *path*             | 'navigation.position'                                    |
| service name       | 'com.victronenergy.gps.signalk\_consolidated'            |

Whilst this example uses an explicit position source.

| Item               | Value                                                    |
|:-------------------|:---------------------------------------------------------|
| *class*            | 'gps'                                                    |
| *name*             | 'simrad'                                                 |
| *path*             | 'navigation.position.values.Actisense2\\.16'             |
| service name       | 'com.victronenergy.gps.signalk\_simrad'                  |

The plugin tries to recover as many properties deriving from the
position source identified by *path* as it can.
Coverage varies dependent upon the capabilities and features of the
position sensor, but a proper configuration will always set the
Venus service's Position/Latitude and Position/Longitude properties.

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

<table>
  <tr>
    <td colspan=2>Use&nbsp;GUI&nbsp;enhancements?</td>
    <td>
      This boolean property determines whether or not to apply the
      GUI enhancements that support rendering of multiple tanks in
      the Venus GUI.
      If you're not bothered about rendering tank data then leave
      unchecked.
    </td>
  </tr>
  <tr>
    <td colspan=2>Service&nbsp;definitions</td>
    <td>
      This array property consists of a collection of *service
      definition* items, each of which specifies a single Venus
      system service.
      Each *service definition* has the following properties:
    </td>
  </tr>
  <tr>
    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>
    <td>Service&nbsp;class</td>
    <td>
      This required string property defines the Venus service class.
      Choose from 'gps', 'tank' or 'temperature' to suit your requirement.
    </td>
  </tr>
  <tr>
    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>
    <td>Service&nbsp;name</td>
    <td>
      This string property supplies a value that will be used to construct
      a unique Venus service name.
      A unique value is required for each configured service in classes
      'gps' and 'temperature'.
      A value can be supplied for services in class 'tank' or the plugin can
      be left to generate its own unique name.
    </td>
  </tr>
  <tr>
    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>
    <td>Signal&nbsp;K&nbsp;path</td>
    <td>
      This string property defines the Signal K data path which forms the
      basis of this service and must point to an entry in the Signal K
      'self' model that returns a primary value of the type implied by your
      choice of *Service class*.
      <p>
      For example, if you set *Service class* to 'tank', then an appropriate
      value for *Signal K path* might be 'tanks.wasteWater.0'.
    </td>
  </tr>
</table>

## Acknowledgements

Thanks to @kwindrem for making this a whole lot easier than it might
have been by designing his repeater software in a way which allows its
components to be leveraged by others.

## Author

Paul Reeve \<<preeve@pdjr.eu>\>
