/*
  GGA - Time, position, and fix related data
  This is one of the sentences commonly emitted by GPS units.
  0      1        2             3 4              5 6 7 8   9     10 11     12 13  14
  |      |        |             | |              | | | |   |      | |       | |   |     
  $GPGGA,172814.0,3723.46587704,N,12202.26957864,W,2,6,1.2,18.893,M,-25.669,M,2.0,0031*hh<CR><LF>

  Field Number:
  0	Message ID $GPGGA
  1	UTC of position fix
  2	Latitude
  3	Direction of latitude: N (north) or S (south)
  4	Longitude
  5	Direction of longitude: E (east) or W (west) 
  6	GPS Quality indicator: 0 = Fix not valid; 1 = GPS fix; 2 = Differential GPS fix, OmniSTAR VBS; 4 = Real-Time Kinematic, fixed integers; 5 = Real-Time Kinematic, float integers, OmniSTAR XP/HP or Location RTK
  7	Number of SVs in use, range from 00 through to 24+
  8	HDOP
  9	Orthometric height (MSL reference)
  10 M: unit of measure for orthometric height is meters
  11 Geoid separation
  12 M: geoid separation measured in meters
  13 Age of differential GPS data record, Type 1 or Type 9. Null field when DGPS is not used.
  14 Reference station ID, range 0000-4095. A null field when any reference station ID is selected and no corrections are received
*/

const {
  toSentence,
  toNmeaDegreesLatitude,
  toNmeaDegreesLongitude
} = require('../nmea.js')

module.exports = function (app) {
  return {
    title: 'GGA - Time, position, and fix related data',
    keys: [
      'navigation.datetime',
      'navigation.position',
      'navigation.gnss.methodQuality',
      'navigation.gnss.satellites',
      'navigation.gnss.horizontalDilution',
      'navigation.gnss.antennaAltitude',
      'navigation.gnss.geoidalSeparation',
      'navigation.gnss.differentialAge',
      'navigation.gnss.differentialReference'
    ],
    defaults: [
      null, // navigation.datetime
      null, // navigation.position
      0, // navigation.gnss.methodQuality (= GPS Quality indicator: 0 = Fix not valid; 1 = GPS fix; 2 = Differential GPS fix, OmniSTAR VBS; 4 = Real-Time Kinematic, fixed integers; 5 = Real-Time Kinematic, float integers, OmniSTAR XP/HP or Location RTK)
      0, // navigation.gnss.satellites (= Number of SVs in use, range from 00 through to 24+)
      0, // navigation.gnss.horizontalDilution (= HDOP)
      0, // navigation.gnss.antennaAltitude (= Orthometric height (MSL reference))
      0, // navigation.gnss.geoidalSeparation (= Geoid separation),
      null, // navigation.gnss.differentialAge (= Age of differential GPS data record, Type 1 or Type 9. Null field when DGPS is not used)
      null // navigation.gnss.differentialReference (= Reference station ID, range 0000-4095. A null field when any reference station ID is selected and no corrections are received)
    ],
    f: function (datetime8601, position, gnssMethodQuality, gnssSatellites, gnssHorizontalDilution, gnssAntennaAltitude, gnssgeoidalSeparation, gnssDifferentialAge, gnssDifferentialReference) {
      let time = ''
      let ignssMethodQuality = 0

      if (!datetime8601 || (typeof datetime8601 === 'string' && datetime8601.trim() === '')) {
        datetime8601 = new Date().toISOString()
      }

      if (datetime8601.length > 0) {
        let datetime = new Date(datetime8601)
        let hours = ('00' + datetime.getUTCHours()).slice(-2)
        let minutes = ('00' + datetime.getUTCMinutes()).slice(-2)
        let seconds = ('00' + datetime.getUTCSeconds()).slice(-2)
        time = hours + minutes + seconds
      }

      if (!position) {
        console.error(`[signalk-to-nmea0183] GGA: no position, not converting`)
        return
      }

      if (!gnssDifferentialAge) {
        gnssDifferentialAge = ''
      }

      if (!gnssDifferentialReference) {
        gnssDifferentialReference = ''
      }

      switch (gnssMethodQuality) {
         case 'no GPS' :
           ignssMethodQuality = 0
           break
         case 'GNSS Fix' :
           ignssMethodQuality = 1
           break
         case 'DGNSS fix' :
           ignssMethodQuality = 2
           break
         case 'Precise GNSS' :
           ignssMethodQuality = 3
           break
         case 'RTK fixed integer' :
           ignssMethodQuality = 4
           break
         case 'RTK float' :
           ignssMethodQuality = 5
           break
         case 'Estimated (DR) mode' :
           ignssMethodQuality = 6
           break
         case 'Manual input' :
           ignssMethodQuality = 7
           break
         case 'Simulator mode' :
           ignssMethodQuality = 8
           break
      }

      return toSentence([
        '$GPGGA',
        time,
        toNmeaDegreesLatitude(position.latitude),
        toNmeaDegreesLongitude(position.longitude),
        ignssMethodQuality,
        gnssSatellites,
        gnssHorizontalDilution,
        gnssAntennaAltitude,
        'M',
        gnssgeoidalSeparation,
        'M',
        gnssDifferentialAge,
        gnssDifferentialReference
      ])
    }
  }
}
