import { testSequential, testSuppressed } from './testutil'

/**
 * MWD - Wind Direction & Speed (relative to North)
 *
 * $IIMWD,dirTrue,T,dirMag,M,speedKn,N,speedMs,M*cs
 *
 * Field layout:
 *   0  True wind direction (degrees)
 *   1  T
 *   2  Magnetic wind direction (degrees) — derived from true direction and
 *      magnetic variation; empty unless BOTH are present
 *   3  M
 *   4  Wind speed (knots)
 *   5  N
 *   6  Wind speed (m/s)
 *   7  M
 *
 * All three Signal K inputs default to MISSING so the combined stream fires
 * as soon as any one path emits.  Non-finite values are treated as absent
 * and produce empty fields; when no field can be populated the sentence is
 * suppressed.
 *
 * Checksums generated from the encoder and verified independently.
 * See test/testutil.ts for the BaconJS timing rationale behind testSequential.
 */

const deg = (d: number): number => (d * Math.PI) / 180

describe('MWD', function () {
  this.timeout(300)

  it('emits true and magnetic direction with speed in knots and m/s', (done) => {
    // dirTrue=90°, variation=10°E → dirMag=80°, speed=5 m/s ≈ 9.72 kn
    testSequential(
      'MWD',
      [
        { path: 'environment.wind.directionTrue', value: deg(90) },
        { path: 'navigation.magneticVariation', value: deg(10) },
        { path: 'environment.wind.speedTrue', value: 5 }
      ],
      '$IIMWD,90.00,T,80.00,M,9.72,N,5.00,M*4C',
      done
    )
  })

  it('wraps magnetic direction below zero into 0-359 range', (done) => {
    // dirTrue=5°, variation=10°E → raw magnetic = -5° → 355°
    testSequential(
      'MWD',
      [
        { path: 'environment.wind.directionTrue', value: deg(5) },
        { path: 'navigation.magneticVariation', value: deg(10) }
      ],
      '$IIMWD,5.00,T,355.00,M,,N,,M*42',
      done
    )
  })

  it('leaves the magnetic field empty when variation is absent', (done) => {
    // Only the true direction is known — magnetic cannot be derived.
    testSequential(
      'MWD',
      [{ path: 'environment.wind.directionTrue', value: deg(90) }],
      '$IIMWD,90.00,T,,M,,N,,M*63',
      done
    )
  })

  it('leaves both direction fields empty when only speed is present', (done) => {
    testSequential(
      'MWD',
      [{ path: 'environment.wind.speedTrue', value: 5 }],
      '$IIMWD,,T,,M,9.72,N,5.00,M*4D',
      done
    )
  })

  it('treats a non-finite direction as absent (empty field, not NaN)', (done) => {
    // directionTrue is NaN → both direction fields empty; speed still emitted.
    testSequential(
      'MWD',
      [
        { path: 'environment.wind.directionTrue', value: NaN },
        { path: 'environment.wind.speedTrue', value: 5 }
      ],
      '$IIMWD,,T,,M,9.72,N,5.00,M*4D',
      done
    )
  })

  it('suppresses the sentence when every value is non-finite', (done) => {
    testSuppressed(
      'MWD',
      [
        { path: 'environment.wind.directionTrue', value: NaN },
        { path: 'navigation.magneticVariation', value: Infinity },
        { path: 'environment.wind.speedTrue', value: NaN }
      ],
      done
    )
  })
})
