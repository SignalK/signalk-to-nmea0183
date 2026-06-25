import { testSequential, testSuppressed } from './testutil'

/**
 * HDMC - HDM sentence calculated from True heading and Variation
 *
 * Derives: headingMagnetic = headingTrue − magneticVariation
 * Produces: $IIHDM,x.x,M*hh
 *
 * Both inputs carry defaults (MISSING sentinel) so the combined stream fires
 * as soon as either path emits.  The guard in the encoder suppresses output
 * until both have real values.
 *
 * Checksums were pre-computed and verified independently.
 * See test/testutil.ts for the BaconJS timing rationale behind testSequential.
 */

const deg = (d: number): number => (d * Math.PI) / 180

describe('HDMC', function () {
  this.timeout(300)

  // ── normal computation ───────────────────────────────────────────────────

  it('computes magnetic heading by subtracting variation from true heading', (done) => {
    // headingTrue=180°, variation=+10° (easterly) → hdgMag = 180 - 10 = 170°
    // $IIHDM,170.0,M*24
    testSequential(
      'HDMC',
      [
        { path: 'navigation.magneticVariation', value: deg(10) },
        { path: 'navigation.headingTrue', value: Math.PI }
      ],
      '$IIHDM,170.0,M*24',
      done
    )
  })

  it('wraps into [0, 360) when variation exceeds true heading', (done) => {
    // headingTrue=5°, variation=+10° → hdgMag = 5 - 10 = -5° → 355°
    // $IIHDM,355.0,M*21
    testSequential(
      'HDMC',
      [
        { path: 'navigation.magneticVariation', value: deg(10) },
        { path: 'navigation.headingTrue', value: deg(5) }
      ],
      '$IIHDM,355.0,M*21',
      done
    )
  })

  it('wraps into [0, 360) when westerly variation pushes heading above 360°', (done) => {
    // headingTrue=355°, variation=-10° (westerly) → hdgMag = 355-(-10) = 365° → 5°
    // $IIHDM,5.0,M*27
    testSequential(
      'HDMC',
      [
        { path: 'navigation.magneticVariation', value: deg(-10) },
        { path: 'navigation.headingTrue', value: deg(355) }
      ],
      '$IIHDM,5.0,M*27',
      done
    )
  })

  // ── suppression ──────────────────────────────────────────────────────────

  it('does not emit when only headingTrue is present (variation required)', (done) => {
    testSuppressed(
      'HDMC',
      [{ path: 'navigation.headingTrue', value: Math.PI }],
      done
    )
  })

  it('does not emit when only magneticVariation is present (headingTrue required)', (done) => {
    testSuppressed(
      'HDMC',
      [{ path: 'navigation.magneticVariation', value: deg(10) }],
      done
    )
  })
})
