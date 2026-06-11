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

import {
  toSentence,
  toNmeaDegreesLatitude,
  toNmeaDegreesLongitude,
  formatDatetime
} from '../nmea'
import type { Position } from '@signalk/server-api'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'GGA',
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
    f: function (
      datetime8601: string | null | undefined,
      position: Position | null | undefined,
      gnssMethodQuality: string | number,
      gnssSatellites: number,
      gnssHorizontalDilution: number,
      gnssAntennaAltitude: number,
      gnssGeoidalSeparation: number,
      gnssDifferentialAge: number | string | null | undefined,
      gnssDifferentialReference: string | null | undefined
    ): string | undefined {
      let datetimeInput: string = datetime8601 ?? ''
      if (
        !datetimeInput ||
        (typeof datetimeInput === 'string' && datetimeInput.trim() === '')
      ) {
        datetimeInput = new Date().toISOString()
      }

      const datetime = formatDatetime(datetimeInput)

      if (!position) {
        _app.debug(`GGA: skipping emission - no position available`)
        return undefined
      }

      gnssDifferentialAge = gnssDifferentialAge ?? ''
      gnssDifferentialReference = gnssDifferentialReference ?? ''

      let ignssMethodQuality = 0
      switch (gnssMethodQuality) {
        case 'GNSS Fix':
          ignssMethodQuality = 1
          break
        case 'DGNSS fix':
          ignssMethodQuality = 2
          break
        case 'RTK fixed integer':
          ignssMethodQuality = 4
          break
        case 'RTK float':
          ignssMethodQuality = 5
          break
        default:
          if (typeof gnssMethodQuality === 'number') {
            ignssMethodQuality = gnssMethodQuality
          }
      }

      const sats = (isNaN(gnssSatellites) ? 0 : gnssSatellites)
        .toString()
        .padStart(2, '0')

      return toSentence([
        '$GPGGA',
        datetime.time,
        toNmeaDegreesLatitude(position.latitude),
        toNmeaDegreesLongitude(position.longitude),
        ignssMethodQuality,
        sats,
        (isNaN(gnssHorizontalDilution) ? 0 : gnssHorizontalDilution).toFixed(1),
        (isNaN(gnssAntennaAltitude) ? 0 : gnssAntennaAltitude).toFixed(1),
        'M',
        (isNaN(gnssGeoidalSeparation) ? 0 : gnssGeoidalSeparation).toFixed(1),
        'M',
        gnssDifferentialAge,
        gnssDifferentialReference
      ])
    }
  }
}
