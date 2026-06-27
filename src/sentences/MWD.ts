/**
True wind direction and speed:
$IIMWD,x.x,T,x.x,M,x.x,N,x.x,M*hh
 I I I I I I I__I_Wind speed in m/s
 I I I I I__I_ Wind speed in knots
 I I I__I_Wind direction from 0° to 359° magnetic
 I__I_Wind direction from 0° to 359° true

 speed Might be ground speed.

 Signal K inputs and missing-data handling
 -----------------------------------------
 environment.wind.directionTrue — true wind direction.
 navigation.magneticVariation   — used to derive the magnetic direction.
 environment.wind.speedTrue      — wind speed (m/s).

 All three default to MISSING so the combined stream fires as soon as any
 one path emits.  A non-finite value (null, NaN, Infinity or a non-numeric
 value) is treated as absent and produces an empty field rather than a
 fabricated "0.0" or a literal "NaN":
   - true direction empty when directionTrue is absent,
   - magnetic direction empty unless BOTH directionTrue and variation are
     present (it cannot be derived otherwise),
   - both speed fields empty when speedTrue is absent.
 When no field can be populated the sentence is suppressed entirely.
 */

// NMEA0183 Encoder MWD   $IIMWD,279.07,T,90.97,M,9.75,N,5.02,M*74
import * as nmea from '../nmea'
import { MISSING, finiteNum, type MaybeNumber } from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'MWD',
    title: 'MWD - Wind relative to North, speed might be ground speed.',
    keys: [
      'environment.wind.directionTrue',
      'navigation.magneticVariation',
      'environment.wind.speedTrue'
    ],
    defaults: [MISSING, MISSING, MISSING],
    f: function (
      directionTrue: MaybeNumber,
      magneticVariation: MaybeNumber,
      speedTrue: MaybeNumber
    ): string | undefined {
      const directionTrueField = finiteNum(directionTrue)
        ? nmea.radsToPositiveDeg(directionTrue).toFixed(2)
        : ''

      // The magnetic direction can only be derived when both the true
      // direction and the variation are available.
      const directionMagneticField =
        finiteNum(directionTrue) && finiteNum(magneticVariation)
          ? nmea
              .radsToPositiveDeg(
                nmea.fixAngle(directionTrue - magneticVariation)
              )
              .toFixed(2)
          : ''

      const speedKnotsField = finiteNum(speedTrue)
        ? nmea.msToKnots(speedTrue).toFixed(2)
        : ''
      const speedMsField = finiteNum(speedTrue) ? speedTrue.toFixed(2) : ''

      // Nothing useful to report — suppress rather than emit an empty hull.
      if (
        directionTrueField === '' &&
        directionMagneticField === '' &&
        speedKnotsField === '' &&
        speedMsField === ''
      ) {
        return undefined
      }

      return nmea.toSentence([
        '$IIMWD',
        directionTrueField,
        'T',
        directionMagneticField,
        'M',
        speedKnotsField,
        'N',
        speedMsField,
        'M'
      ])
    }
  }
}
