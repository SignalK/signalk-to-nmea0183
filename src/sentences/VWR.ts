/**
Apparent wind angle and speed:
$IIVWR,x.x,a,x.x,N,x.x,M,x.x,K*hh
 I I I I I I I__I_Wind speed in kph
 I I I I I__I_Wind speed in m/s
 I I I__I_Wind speed in knots
 I__I_Apparent wind angle from 0° to 180°, L=port, R=starboard
 */

// NMEA0183 Encoder VWR   $IIVWR,42.01,R,14.11,N,7.26,M,26.14,K*75
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'VWR',
    optionKey: 'VWR',
    title: 'VWR - Apparent wind angle and speed',
    keys: ['environment.wind.speedApparent', 'environment.wind.angleApparent'],
    defaults: [undefined, undefined],
    f: function vwr(
      speedApparent: number | undefined,
      angleApparent: number | undefined
    ): string | undefined {
      if (
        speedApparent === undefined ||
        speedApparent === null ||
        isNaN(speedApparent) ||
        angleApparent === undefined ||
        angleApparent === null ||
        isNaN(angleApparent)
      ) {
        return undefined
      }

      const normalizedAngle = nmea.fixAngle(angleApparent)
      const windDirection = normalizedAngle < 0 ? 'L' : 'R'
      const magnitude = Math.abs(normalizedAngle)

      return nmea.toSentence([
        '$IIVWR',
        nmea.radsToDeg(magnitude).toFixed(2),
        windDirection,
        nmea.msToKnots(speedApparent).toFixed(2),
        'N',
        speedApparent.toFixed(2),
        'M',
        nmea.msToKM(speedApparent).toFixed(2),
        'K'
      ])
    }
  }
}
