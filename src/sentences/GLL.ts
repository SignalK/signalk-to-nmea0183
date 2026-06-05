/*
Geographical position, latitude and longitude:
$--GLL,llll.ll,a,yyyyy.yy,a,hhmmss.ss,A*hh
       |       | |        | |          |_Status (A=valid, V=invalid)
       |       | |        | |_UTC time
       |       | |________|_Longitude, E/W
       |_______|_Latitude, N/S

Example: $GPGLL,5943.4970,N,02444.1983,E,200001.00,A*03
*/

import * as nmea from '../nmea'
import type { Position } from '@signalk/server-api'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'GLL',
    title: 'GLL - Geographical position, latitude and longitude',
    keys: ['navigation.datetime', 'navigation.position'],
    defaults: [null, null],
    f: function gll(
      datetime8601: string | null | undefined,
      position: Position | null | undefined
    ): string | undefined {
      if (
        !position ||
        typeof position.latitude !== 'number' ||
        typeof position.longitude !== 'number' ||
        isNaN(position.latitude) ||
        isNaN(position.longitude) ||
        position.latitude < -90 ||
        position.latitude > 90 ||
        position.longitude <= -180 ||
        position.longitude > 180
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

      const datetime = nmea.formatDatetime(datetimeInput)

      return nmea.toSentence([
        '$GPGLL',
        nmea.toNmeaDegreesLatitude(position.latitude),
        nmea.toNmeaDegreesLongitude(position.longitude),
        datetime.time,
        'A'
      ])
    }
  }
}
