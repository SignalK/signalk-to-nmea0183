/*
Sentence 3
$PNKEP,03,x.x,x.x,x.x*hh
        | optimum angle from 0 to 359°
              | VMG efficiency up/down wind in %
                  | Polar efficiency in %

*/
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    title: 'PNKEP,03 - Polar and VMG, and optimum angle.',
    keys: [
      'performance.targetAngle',
      'performance.polarVelocityMadeGoodRatio',
      'performance.polarSpeedRatio'
    ],
    f: function (
      targetAngle: number,
      polarVelocityMadeGoodRatio: number,
      polarSpeedRatio: number
    ): string {
      return nmea.toSentence([
        '$PNKEP',
        '03',
        nmea.radsToPositiveDeg(targetAngle).toFixed(2),
        (polarVelocityMadeGoodRatio * 100.0).toFixed(2),
        (polarSpeedRatio * 100.0).toFixed(2)
      ])
    }
  }
}
