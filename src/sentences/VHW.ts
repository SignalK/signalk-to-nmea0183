/**
 * VHW - Water Speed and Heading
 *
 * $--VHW,x.x,T,x.x,M,x.x,N,x.x,K*hh
 *        |   | |   | |   | |   |
 *        |   | |   | |   | +---+-- Surface speed in km/h
 *        |   | |   | +---+-------- Surface speed in knots
 *        |   | +---+-------------- Magnetic heading
 *        +---+-------------------- True heading
 *
 * Signal K inputs and priority rules
 * -----------------------------------
 * True heading field:
 *   1. navigation.headingTrue  (direct)
 *   2. navigation.headingMagnetic + navigation.magneticVariation (derived)
 *   3. Empty field when neither is resolvable
 *
 * Magnetic heading field:
 *   1. navigation.headingMagnetic  (direct, highest priority)
 *   2. navigation.headingTrue - navigation.magneticVariation (derived)
 *   3. Empty field when neither is resolvable
 *
 * Emission guard: suppress the sentence entirely only when ALL of
 * headingTrue, headingMagnetic, and speedThroughWater are absent.
 * Speed alone, or any heading alone, is enough to emit.
 *
 * Non-finite inputs (null, NaN, Infinity, or a non-numeric value) are
 * treated as absent: a dropped-out sensor yields an empty field rather
 * than a fabricated "0.0" or a literal "NaN" in the sentence.
 *
 * Example (all fields): $IIVHW,201.1,T,209.2,M,6.5,N,12.0,K*6E
 */

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

// Sentinel value used as the default for optional streams so that the
// combined stream can fire even before those paths emit a value.
const MISSING = '' as const
type MaybeNumber = number | typeof MISSING

// Coerce a raw stream value to a usable number, or to MISSING. Signal K
// paths can deliver null (path present but no current value) and a
// misbehaving source can deliver NaN/Infinity or a non-numeric value;
// treating all of those as MISSING leaves the corresponding field empty
// instead of emitting a fabricated reading.
function asNumber(value: unknown): MaybeNumber {
  return typeof value === 'number' && Number.isFinite(value) ? value : MISSING
}

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
    // All four inputs are optional; the stream fires as soon as any
    // path emits for the first time.
    defaults: [MISSING, MISSING, MISSING, MISSING],

    f: function vhw(
      headingTrueRaw: unknown,
      headingMagneticRaw: unknown,
      magneticVariationRaw: unknown,
      speedThroughWaterRaw: unknown
    ): string | undefined {
      // Normalise each raw stream value: anything that is not a finite
      // number (null, NaN, Infinity, non-numeric) becomes MISSING.
      const headingTrue = asNumber(headingTrueRaw)
      const headingMagnetic = asNumber(headingMagneticRaw)
      const magneticVariation = asNumber(magneticVariationRaw)
      const speedThroughWater = asNumber(speedThroughWaterRaw)

      // Suppress when there is nothing useful to send.
      if (
        headingTrue === MISSING &&
        headingMagnetic === MISSING &&
        speedThroughWater === MISSING
      ) {
        return undefined
      }

      // ── Resolve true heading ──────────────────────────────────────────
      // Prefer the direct path; fall back to hdgMag + variation.
      let hdgTrueStr = ''
      if (headingTrue !== MISSING) {
        hdgTrueStr = nmea.radsToPositiveDeg(headingTrue).toFixed(1)
      } else if (headingMagnetic !== MISSING && magneticVariation !== MISSING) {
        hdgTrueStr = nmea
          .radsToPositiveDeg(headingMagnetic + magneticVariation)
          .toFixed(1)
      }

      // ── Resolve magnetic heading ──────────────────────────────────────
      // Prefer the direct path; fall back to hdgTrue - variation.
      let hdgMagStr = ''
      if (headingMagnetic !== MISSING) {
        hdgMagStr = nmea.radsToPositiveDeg(headingMagnetic).toFixed(1)
      } else if (headingTrue !== MISSING && magneticVariation !== MISSING) {
        hdgMagStr = nmea
          .radsToPositiveDeg(headingTrue - magneticVariation)
          .toFixed(1)
      }

      // ── Resolve speed ─────────────────────────────────────────────────
      let stwKnStr = ''
      let stwKmStr = ''
      if (speedThroughWater !== MISSING) {
        stwKnStr = nmea.msToKnots(speedThroughWater).toFixed(2)
        stwKmStr = nmea.msToKM(speedThroughWater).toFixed(2)
      }

      return nmea.toSentence([
        '$IIVHW',
        hdgTrueStr,
        'T',
        hdgMagStr,
        'M',
        stwKnStr,
        'N',
        stwKmStr,
        'K'
      ])
    }
  }
}
