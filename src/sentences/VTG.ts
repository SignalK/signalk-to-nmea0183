/*
Bottom heading and speed:
$IIVTG,x.x,T,x.x,M,x.x,N,x.x,K,A*hh
 I I I I I I I__I_Bottom speed in kph
 I I I I I__I_Bottom speed in knots
 I I I__I_Magnetic bottom heading
 I__ I_True bottom heading
 */
// NMEA0183 Encoder VTG   $IIVTG,224.17,T,224.17,M,12.95,N,23.98,K,A*3B
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'VTG',
    title: 'VTG - Track made good and Ground Speed (COG,SOG)',
    keys: [
      'navigation.courseOverGroundMagnetic',
      'navigation.courseOverGroundTrue',
      'navigation.speedOverGround'
    ],
    f: function (
      courseOverGroundMagnetic: number,
      courseOverGroundTrue: number,
      speedOverGround: number
    ): string {
      return nmea.toSentence([
        '$IIVTG',
        nmea.radsToPositiveDeg(courseOverGroundTrue).toFixed(2),
        'T',
        nmea.radsToPositiveDeg(courseOverGroundMagnetic).toFixed(2),
        'M',
        nmea.msToKnots(speedOverGround).toFixed(2),
        'N',
        nmea.msToKM(speedOverGround).toFixed(2),
        'K',
        'A'
      ])
    }
  }
}
