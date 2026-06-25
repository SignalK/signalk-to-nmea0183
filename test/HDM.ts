import { testSequential, testSuppressed } from './testutil'

/**
 * HDM - Heading, Magnetic
 *
 * $IIHDM,x.x,M*hh
 *
 * navigation.headingMagnetic is the only input and carries no default.
 * Without it the combined stream never fires and no sentence is produced.
 *
 * Checksums were pre-computed and verified independently.
 * See test/testutil.ts for the BaconJS timing rationale behind testSequential.
 */

describe('HDM', function () {
  // ── normal emission ──────────────────────────────────────────────────────

  it('emits heading magnetic in degrees', (done) => {
    // 0.5 rad ≈ 28.6°  →  $IIHDM,28.6,M*1E
    testSequential(
      'HDM',
      [{ path: 'navigation.headingMagnetic', value: 0.5 }],
      '$IIHDM,28.6,M*1E',
      done
    )
  })

  it('wraps heading above 360° into [0, 360)', (done) => {
    // 2π + 0.5 rad should give the same result as 0.5 rad
    // $IIHDM,28.6,M*1E
    testSequential(
      'HDM',
      [{ path: 'navigation.headingMagnetic', value: 2 * Math.PI + 0.5 }],
      '$IIHDM,28.6,M*1E',
      done
    )
  })

  it('wraps negative heading into [0, 360)', (done) => {
    // -0.5 rad → 360 - 28.6 = 331.4°  →  $IIHDM,331.4,M*27
    testSequential(
      'HDM',
      [{ path: 'navigation.headingMagnetic', value: -0.5 }],
      '$IIHDM,331.4,M*27',
      done
    )
  })

  // ── suppression ──────────────────────────────────────────────────────────

  it('does not emit when headingMagnetic has not been pushed', (done) => {
    // No paths at all — stream must not fire
    testSuppressed('HDM', [], done)
  })
})
