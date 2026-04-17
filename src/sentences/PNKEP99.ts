import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    title: 'PNKEP,99 - Debug',
    keys: [
      'environment.wind.angleApparent',
      'environment.wind.speedApparent',
      'environment.wind.angleTrueWater',
      'environment.wind.speedTrue',
      'navigation.speedThroughWater',
      'performance.polarSpeed',
      'performance.polarSpeedRatio'
    ],
    f: function (
      angleApparent: number,
      speedApparent: number,
      angleTrueWater: number,
      speedTrue: number,
      speedThroughWater: number,
      polarSpeed: number,
      polarSpeedRatio: number
    ): string {
      return nmea.toSentence([
        '$PNKEP',
        '99',
        nmea.radsToDeg(angleApparent),
        nmea.msToKnots(speedApparent),
        nmea.radsToDeg(angleTrueWater),
        nmea.msToKnots(speedTrue),
        nmea.msToKnots(speedThroughWater),
        nmea.msToKnots(polarSpeed),
        polarSpeedRatio
      ])
    }
  }
}
