import { testSequential, testSuppressed } from './testutil'

/**
 * HDTC - HDT sentence calculated from Magnetic heading and Variation
 *
 * Derives: headingTrue = headingMagnetic + magneticVariation
 * Produces: $IIHDT,x.x,T*hh
 *
 * Both inputs carry defaults (MISSING sentinel) so the combined stream fires
 * as soon as either path emits.  The guard in the encoder suppresses output
 * until both have real values.
 *
 * Checksums were pre-computed and verified independently.
 * See test/testutil.ts for the BaconJS timing rationale behind testSequential.
 */

const deg = (d: number): number => (d * Math.PI) / 180

describe('HDTC', function () {
  this.timeout(300)

  // ── normal computation ───────────────────────────────────────────────────

  it('computes true heading by adding variation to magnetic heading', (done) => {
    // hdgMag=170°, variation=+10° → hdgTrue = 170 + 10 = 180°
    // $IIHDT,180.0,T*2B
    testSequential(
      'HDTC',
      [
        { path: 'navigation.magneticVariation', value: deg(10) },
        { path: 'navigation.headingMagnetic', value: deg(170) }
      ],
      '$IIHDT,180.0,T*2B',
      done
    )
  })

  it('wraps into [0, 360) when sum exceeds 360°', (done) => {
    // hdgMag=355°, variation=+10° → hdgTrue = 355 + 10 = 365° → 5°
    // $IIHDT,5.0,T*27
    testSequential(
      'HDTC',
      [
        { path: 'navigation.magneticVariation', value: deg(10) },
        { path: 'navigation.headingMagnetic', value: deg(355) }
      ],
      '$IIHDT,5.0,T*27',
      done
    )
  })

  it('wraps into [0, 360) when westerly variation produces a negative sum', (done) => {
    // hdgMag=5°, variation=-10° (westerly) → hdgTrue = 5 + (-10) = -5° → 355°
    // $IIHDT,355.0,T*21
    testSequential(
      'HDTC',
      [
        { path: 'navigation.magneticVariation', value: deg(-10) },
        { path: 'navigation.headingMagnetic', value: deg(5) }
      ],
      '$IIHDT,355.0,T*21',
      done
    )
  })

  // ── suppression ──────────────────────────────────────────────────────────

  it('does not emit when only headingMagnetic is present (variation required)', (done) => {
    testSuppressed(
      'HDTC',
      [{ path: 'navigation.headingMagnetic', value: deg(170) }],
      done
    )
  })

  it('does not emit when only magneticVariation is present (headingMagnetic required)', (done) => {
    testSuppressed(
      'HDTC',
      [{ path: 'navigation.magneticVariation', value: deg(10) }],
      done
    )
  })
})
