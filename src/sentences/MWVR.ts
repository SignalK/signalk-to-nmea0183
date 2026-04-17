/*
      === MWV - Wind Speed and Angle ===

      ------------------------------------------------------------------------------
      1   2 3   4 5
      |   | |   | |
      $--MWV,x.x,a,x.x,a*hh<CR><LF>
      ------------------------------------------------------------------------------

      Field Number:

      1. Wind Angle, 0 to 360 degrees
      2. Reference, R = Relative, T = True
      3. Wind Speed
      4. Wind Speed Units, K/M/N
      5. Status, A = Data Valid
      6. Checksum
    */

// NMEA0183 Encoder MWVR   $INMWV,35.01,R,7.9,M,A*30
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'MWV',
    title: 'MWV - Apparent Wind heading and speed',
    keys: ['environment.wind.angleApparent', 'environment.wind.speedApparent'],
    f: function (angle: number, speed: number): string {
      return nmea.toSentence([
        '$IIMWV',
        nmea.radsToPositiveDeg(angle).toFixed(2),
        'R',
        speed.toFixed(2),
        'M',
        'A'
      ])
    }
  }
}
