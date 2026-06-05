/**
$IIVHW,x .x,T,x.x,M,x.x,N,x.x,K*hh
       I I I I I I I__I_Surface speed in kph
       I I I I I__I_Surface speed in knots
       I I I__I_Magnetic compass heading
       I__I_True compass heading
 */

// NMEA0183 Encoder VHW   $IIVHW,201.1,T,209.2,M,6.5,N,12.0,K*6E

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

/**
 * Creates a VHW (Speed and direction) NMEA0183 sentence encoder.
 * @param _app - The SignalK application instance (unused).
 * @returns A SentenceEncoder object for the VHW sentence.
 */
export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'VHW',
    title: 'VHW - Speed and direction',
    keys: [
      'navigation.headingTrue',
      'navigation.headingMagnetic',
      'navigation.magneticVariation',
      'navigation.speedThroughWater'
    ],
    defaults: [null, null, 0, null],
    /**
     * Encodes speed and heading data into a VHW NMEA0183 sentence.
     * @param headingTrue True heading in radians, or null if unavailable.
     * @param headingMagnetic Magnetic heading in radians, or null if unavailable.
     * @param magneticVariation Magnetic variation in radians.
     * @param speedThroughWater Speed through water in meters per second, or null if unavailable.
     * @returns The encoded VHW sentence string, or undefined if required data is missing.
     */
    f: function vhw(
      headingTrue: number | null | undefined,
      headingMagnetic: number | null | undefined,
      magneticVariation: number | null | undefined,
      speedThroughWater: number | null | undefined
    ): string | undefined {
      if (headingMagnetic === null && headingTrue !== null) {
        headingMagnetic = headingTrue - magneticVariation
      }
      if (headingTrue === null && headingMagnetic !== null) {
        headingTrue = headingMagnetic + magneticVariation
      }

      if (
        headingTrue === null || headingTrue === undefined ||
        headingMagnetic === null || headingMagnetic === undefined ||
        magneticVariation === null || magneticVariation === undefined ||
        speedThroughWater === null || speedThroughWater === undefined ||
        isNaN(speedThroughWater)
      ) {
        return undefined
      }

      return nmea.toSentence([
        '$IIVHW',
        nmea.radsToPositiveDeg(headingTrue).toFixed(1),
        'T',
        nmea.radsToPositiveDeg(headingMagnetic).toFixed(1),
        'M',
        nmea.msToKnots(speedThroughWater).toFixed(2),
        'N',
        nmea.msToKM(speedThroughWater).toFixed(2),
        'K'
      ])
    }
  }
}
