import { testSequential, testSuppressed } from './testutil'

/**
 * HDT - Heading, True
 *
 * $IIHDT,x.x,T*hh
 *
 * navigation.headingTrue is the only input and carries no default.
 * Without it the combined stream never fires and no sentence is produced.
 * For derived true heading (from magnetic + variation) use HDTC instead.
 *
 * Checksums were pre-computed and verified independently.
 * See test/testutil.ts for the BaconJS timing rationale behind testSequential.
 */

describe('HDT', function () {
  // ── normal emission ──────────────────────────────────────────────────────

  it('emits heading true in degrees', (done) => {
    // pi rad = 180.0°  →  $IIHDT,180.0,T*2B
    testSequential(
      'HDT',
      [{ path: 'navigation.headingTrue', value: Math.PI }],
      '$IIHDT,180.0,T*2B',
      done
    )
  })

  it('emits the example from the source comment', (done) => {
    // 200.1° in radians
    // $IIHDT,200.1,T*21
    testSequential(
      'HDT',
      [{ path: 'navigation.headingTrue', value: (200.1 * Math.PI) / 180 }],
      '$IIHDT,200.1,T*21',
      done
    )
  })

  it('wraps heading above 360° into [0, 360)', (done) => {
    // 2π + π = 3π rad → 180.0°  →  $IIHDT,180.0,T*2B
    testSequential(
      'HDT',
      [{ path: 'navigation.headingTrue', value: 3 * Math.PI }],
      '$IIHDT,180.0,T*2B',
      done
    )
  })

  // ── suppression ──────────────────────────────────────────────────────────

  it('does not emit when headingTrue has not been pushed', (done) => {
    testSuppressed('HDT', [], done)
  })
})
