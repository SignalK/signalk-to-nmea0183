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
    defaults: [null, null, null, null, null, null, null],
    f: function pnkep99(
      angleApparent: number | null | undefined,
      speedApparent: number | null | undefined,
      angleTrueWater: number | null | undefined,
      speedTrue: number | null | undefined,
      speedThroughWater: number | null | undefined,
      polarSpeed: number | null | undefined,
      polarSpeedRatio: number | null | undefined
    ): string | undefined {
      if (
        angleApparent == null ||
        isNaN(angleApparent) ||
        speedApparent == null ||
        isNaN(speedApparent) ||
        angleTrueWater == null ||
        isNaN(angleTrueWater) ||
        speedTrue == null ||
        isNaN(speedTrue) ||
        speedThroughWater == null ||
        isNaN(speedThroughWater)
      ) {
        return undefined
      }

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
