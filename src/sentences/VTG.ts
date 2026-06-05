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
      'navigation.speedOverGround',
      'navigation.magneticVariation'
    ],
    defaults: [null, null, null, 0],
    f: function vtg(
      courseOverGroundMagnetic: number | null,
      courseOverGroundTrue: number | null,
      speedOverGround: number | null,
      magneticVariation: number
    ): string | undefined {
      if (speedOverGround === null || isNaN(speedOverGround)) {
        return undefined
      }

      if (courseOverGroundMagnetic === null && courseOverGroundTrue !== null) {
        courseOverGroundMagnetic = courseOverGroundTrue - magneticVariation
      }

      if (courseOverGroundTrue === null && courseOverGroundMagnetic !== null) {
        courseOverGroundTrue = courseOverGroundMagnetic + magneticVariation
      }

      const cogTrue = (courseOverGroundTrue !== null && !isNaN(courseOverGroundTrue))
        ? nmea.radsToPositiveDeg(courseOverGroundTrue).toFixed(1)
        : ''

      const cogMag = (courseOverGroundMagnetic !== null && !isNaN(courseOverGroundMagnetic))
        ? nmea.radsToPositiveDeg(courseOverGroundMagnetic).toFixed(1)
        : ''

      return nmea.toSentence([
        '$IIVTG',
        cogTrue,
        'T',
        cogMag,
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
