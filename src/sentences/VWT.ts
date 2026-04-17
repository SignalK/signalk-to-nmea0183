/**
$IIVWT,x.x,a,x.x,N,x.x,M,x.x,K*hh
 I I I I I I I__I_Wind speed in kph
 I I I I I__I_Wind speed in m/s
 I I I_ I_Wind speed in knots
 I__I_True wind angle from 0° to 180° , L=port, R=starboard
 */

// NMEA0183 Encoder VWT   $IIVWT,86.71,a,12.58,N,6.47,M,23.29,K*45

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'VWT',
    title: 'VWT - True wind speed relative to boat.',
    keys: ['environment.wind.angleTrueWater', 'environment.wind.speedTrue'],
    f: function (angleTrueWater: number, speedTrue: number): string {
      // environment.wind.angleTrueWater is signed radians, negative to port.
      // NMEA 0183 VWT expects magnitude 0..180 followed by L/R.
      let windDirection = 'R'
      if (angleTrueWater < 0) {
        angleTrueWater = -angleTrueWater
        windDirection = 'L'
      }
      return nmea.toSentence([
        '$IIVWT',
        nmea.radsToDeg(angleTrueWater).toFixed(2),
        windDirection,
        nmea.msToKnots(speedTrue).toFixed(2),
        'N',
        speedTrue.toFixed(2),
        'M',
        nmea.msToKM(speedTrue).toFixed(2),
        'K'
      ])
    }
  }
}
