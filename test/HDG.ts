import { testSequential, testSuppressed } from './testutil'

/**
 * HDG - Heading, Deviation & Variation
 *
 * $IIHDG,heading,,,variation,varDir*cs
 *
 * Field layout:
 *   0  Magnetic sensor heading (degrees)
 *   1  Magnetic deviation      — always empty (deviation already applied in SK)
 *   2  Deviation direction     — always empty
 *   3  Magnetic variation (degrees, absolute value)
 *   4  Variation direction: E (positive) or W (negative)
 *
 * navigation.headingMagnetic is required (no default); the sentence is
 * suppressed until it emits.  navigation.magneticVariation is optional;
 * when absent, fields 3-4 are both left empty (strict NMEA).
 *
 * Checksums were pre-computed and verified independently.
 * See test/testutil.ts for the BaconJS timing rationale behind testSequential.
 */

const deg = (d: number): number => (d * Math.PI) / 180

describe('HDG', function () {
  this.timeout(300)

  // ── headingMagnetic only ─────────────────────────────────────────────────

  it('emits heading with empty deviation and variation when only headingMagnetic is pushed', (done) => {
    // 0.5 rad ≈ 28.65°; no variation available → fields 3-4 both empty
    // $IIHDG,28.65,,,,*40
    testSequential(
      'HDG',
      [{ path: 'navigation.headingMagnetic', value: 0.5 }],
      '$IIHDG,28.65,,,,*40',
      done
    )
  })

  it('handles heading near 360°', (done) => {
    // 6.0 rad ≈ 343.77°
    // $IIHDG,343.77,,,,*7D
    testSequential(
      'HDG',
      [{ path: 'navigation.headingMagnetic', value: 6.0 }],
      '$IIHDG,343.77,,,,*7D',
      done
    )
  })

  // ── headingMagnetic + variation ──────────────────────────────────────────

  it('places easterly variation in fields 3-4', (done) => {
    // headingMagnetic=0.5 rad ≈ 28.65°, variation=0.1 rad ≈ 5.73° E
    // $IIHDG,28.65,,,5.73,E*1A
    testSequential(
      'HDG',
      [
        { path: 'navigation.magneticVariation', value: 0.1 },
        { path: 'navigation.headingMagnetic', value: 0.5 },
      ],
      '$IIHDG,28.65,,,5.73,E*1A',
      done
    )
  })

  it('places westerly variation in fields 3-4 with W direction', (done) => {
    // magneticVariation=-0.1 rad (negative = westerly per Signal K spec)
    // → absolute value 5.73°, direction W
    // $IIHDG,28.65,,,5.73,W*08
    testSequential(
      'HDG',
      [
        { path: 'navigation.magneticVariation', value: -0.1 },
        { path: 'navigation.headingMagnetic', value: 0.5 },
      ],
      '$IIHDG,28.65,,,5.73,W*08',
      done
    )
  })

  it('handles zero variation as easterly', (done) => {
    // variation=0 → not negative, so direction is E, degrees 0.00
    // $IIHDG,28.65,,,0.00,E*1B
    testSequential(
      'HDG',
      [
        { path: 'navigation.magneticVariation', value: 0 },
        { path: 'navigation.headingMagnetic', value: 0.5 },
      ],
      '$IIHDG,28.65,,,0.00,E*1B',
      done
    )
  })

  // ── suppression ──────────────────────────────────────────────────────────

  it('does not emit when only magneticVariation is present (headingMagnetic required)', (done) => {
    // headingMagnetic has no default — the sentence must not fire without it
    testSuppressed(
      'HDG',
      [{ path: 'navigation.magneticVariation', value: deg(10) }],
      done
    )
  })
})
