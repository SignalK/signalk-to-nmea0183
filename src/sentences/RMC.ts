/*
      RMC - Recommended Minimum Navigation Information
      This is one of the sentences commonly emitted by GPS units.

      12
      1         2 3       4 5        6  7   8   9    10 11|  13
      |         | |       | |        |  |   |   |    |  | |   |
      $--RMC,hhmmss.ss,A,llll.ll,a,yyyyy.yy,a,x.x,x.x,xxxx,x.x,a,m,*hh<CR><LF>
      Field Number:
      1 UTC Time
      2 Status, V=Navigation receiver warning A=Valid
      3 Latitude
      4 N or S
      5 Longitude
      6 E or W
      7 Speed over ground, knots
      8 Track made good, degrees true
      9 Date, ddmmyy
      10 Magnetic Variation, degrees
      11 E or W
      12 FAA mode indicator (NMEA 2.3 and later)
      13 Checksum
    */
// Example: $GPRMC,200152.00,A,5943.2980,N,02444.1043,E,6.7,194.3,051215,8.1,E*5B
import {
  toSentence,
  toNmeaDegreesLatitude,
  toNmeaDegreesLongitude,
  radsToDeg,
  radsToPositiveDeg,
  msToKnots,
  formatDatetime
} from '../nmea'
import type { Position } from '@signalk/server-api'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'RMC',
    title: 'RMC - GPS recommended minimum',
    keys: [
      'navigation.datetime',
      'navigation.speedOverGround',
      'navigation.courseOverGroundTrue',
      'navigation.position',
      'navigation.magneticVariation'
    ],
    defaults: [null, undefined, undefined, undefined, 0], // datetime, sog, cog, position, magneticVariation
    f: function rmc(
      datetime8601: string | null | undefined,
      sog: number | null | undefined,
      cog: number | null | undefined,
      position: Position | null | undefined,
      magneticVariation: number | null | undefined
    ): string | undefined {
      if (
        position === undefined ||
        position === null ||
        sog === undefined ||
        sog === null ||
        isNaN(sog)
      ) {
        return undefined
      }

      let datetimeInput: string = datetime8601 ?? ''
      if (
        !datetimeInput ||
        (typeof datetimeInput === 'string' && datetimeInput.trim() === '')
      ) {
        datetimeInput = new Date().toISOString()
      }

      const datetime = formatDatetime(datetimeInput)
      let magneticVariationDeg = ''
      let magneticVariationDir = ''
      if (typeof magneticVariation === 'number' && !isNaN(magneticVariation)) {
        magneticVariationDir = magneticVariation < 0 ? 'W' : 'E'
        magneticVariationDeg = radsToDeg(Math.abs(magneticVariation)).toFixed(1)
      }

      const cogFormatted =
        cog != null && !isNaN(cog) ? radsToPositiveDeg(cog).toFixed(1) : ''

      return toSentence([
        '$GPRMC',
        datetime.time,
        'A',
        toNmeaDegreesLatitude(position.latitude),
        toNmeaDegreesLongitude(position.longitude),
        msToKnots(sog).toFixed(1),
        cogFormatted,
        datetime.date,
        magneticVariationDeg,
        magneticVariationDir,
        'A' // FAA mode indicator (A=Autonomous)
      ])
    }
  }
}
