/*
HDG - Heading, Deviation & Variation

       0   1   2 3   4
       |   |   | |   |
$--HDG,x.x,x.x,a,x.x,a*hh<CR><LF>

Field Number:
0 Magnetic Sensor heading in degrees
1 Magnetic Deviation, degrees
2 Magnetic Deviation direction, E = Easterly, W = Westerly
3 Magnetic Variation degrees
4 Magnetic Variation direction, E = Easterly, W = Westerly
*/

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'HDG',
    title: 'HDG - Heading, Deviation & Variation',
    keys: ['navigation.headingMagnetic', 'navigation.magneticVariation'],
    defaults: [undefined, ''],
    f: function hdg(
      headingMagnetic: number,
      magneticVariation: number | ''
    ): string {
      let magneticVariationDeg = ''
      let magneticVariationDir = ''
      if (magneticVariation !== '') {
        magneticVariationDir = 'E'
        if (magneticVariation < 0) {
          magneticVariationDir = 'W'
          magneticVariation = Math.abs(magneticVariation)
        }
        magneticVariationDeg = nmea.radsToDeg(magneticVariation).toFixed(2)
      }

      return nmea.toSentence([
        '$IIHDG',
        nmea.radsToPositiveDeg(headingMagnetic).toFixed(2),
        '',
        '',
        magneticVariationDeg,
        magneticVariationDir
      ])
    }
  }
}
