## Change Log

### v1.4.0 (2019/03/20 18:21 +00:00)
- [#31](https://github.com/SignalK/signalk-to-nmea0183/pull/31) Add support for GGA sentence (@fabdrol)

### v1.3.1 (2019/03/16 19:14 +00:00)
- [#33](https://github.com/SignalK/signalk-to-nmea0183/pull/33) MWV angle should be always positive (@tkurki)

### v1.3.0 (2018/10/08 05:49 +00:00)
- [#28](https://github.com/SignalK/signalk-to-nmea0183/pull/28) Rudder Sensor Angle (@Dirk--)

### v1.2.1 (2018/09/24 17:14 +00:00)
- [#27](https://github.com/SignalK/signalk-to-nmea0183/pull/27) fix: use environment.wind.angleTrueWater (@tkurki)

### v1.2.0 (2018/08/23 16:15 +00:00)
- [#16](https://github.com/SignalK/signalk-to-nmea0183/pull/16) feature: Add back Silva/Nexus/Garmin proprietary sentences TBS and CD1 (@joabakk)
- [#22](https://github.com/SignalK/signalk-to-nmea0183/pull/22) Fix: Set time of position fix time to UTC as defined in RMC sentence (@davidsanner)
- [#23](https://github.com/SignalK/signalk-to-nmea0183/pull/23) Rename XDRNA,js to XDRNA.js (@davidsanner)

### v1.1.0 (2018/05/08 20:15 +00:00)
- [#21](https://github.com/SignalK/signalk-to-nmea0183/pull/21) fix RMC sentence, add Variation to HDG setence (@davidsanner)

### v1.0.2 (2018/05/07 04:20 +00:00)
- [#20](https://github.com/SignalK/signalk-to-nmea0183/pull/20) fix: RMC for >99 degrees, error handling (@tkurki)

### v1.0.0 (2018/04/08 20:05 +00:00)
- [#17](https://github.com/SignalK/signalk-to-nmea0183/pull/17) Create XDRNA.js (@CaptainRon47)
- [#13](https://github.com/SignalK/signalk-to-nmea0183/pull/13) fix: use blank as the default when magneticVariation is missing (@tkurki)
- [#14](https://github.com/SignalK/signalk-to-nmea0183/pull/14) Fix undefined default check (@tkurki)

### v0.0.2 (2017/12/31 08:22 +00:00)
- [#12](https://github.com/SignalK/signalk-to-nmea0183/pull/12) fix: remove magneticVariation from RMC sentence (@sbender9)

### v0.1.0 (2017/10/09 18:58 +00:00)
- [#10](https://github.com/SignalK/signalk-to-nmea0183/pull/10) Split sentences to files and add conversions (@tkurki)
- [#9](https://github.com/SignalK/signalk-to-nmea0183/pull/9) Add mechanism for providing default values, fix RMC datetime, add test (@tkurki)
- [#7](https://github.com/SignalK/signalk-to-nmea0183/pull/7) Fix sentence format for picky parsers like Isailor/Android (@netAction)
- [#4](https://github.com/SignalK/signalk-to-nmea0183/pull/4) Fix convertion to celsius for MTW sentence (@sbender9)
- [#2](https://github.com/SignalK/signalk-to-nmea0183/pull/2) Add more NMEA 0183 conversions  (@sbender9)
- [#3](https://github.com/SignalK/signalk-to-nmea0183/pull/3) Add real lat/lon to RMC sentence (@sbender9)
- [#1](https://github.com/SignalK/signalk-to-nmea0183/pull/1) Added proprietary Silva/Nexus/Garmin sentences for displaying perform… (@joabakk)