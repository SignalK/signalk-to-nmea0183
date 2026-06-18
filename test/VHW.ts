import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'
import vhwFactory from '../src/sentences/VHW'
import type { SignalKApp } from '../src/types/plugin'

/**
 * VHW test suite
 *
 * Signal K path priority:
 *   True heading:      navigation.headingTrue  >  hdgMag + variation
 *   Magnetic heading:  navigation.headingMagnetic  >  hdgTrue - variation
 *
 * Emission guard: suppress only when ALL of headingTrue, headingMagnetic,
 * and speedThroughWater are absent (magneticVariation alone is not enough).
 *
 * Per the Signal K spec:
 *   headingTrue = headingMagnetic + magneticVariation
 *   headingMagnetic = headingTrue - magneticVariation
 *
 * BaconJS timing note
 * -------------------
 * All four paths carry `defaults: ['', '', '', '']`, so the combined stream
 * fires the moment the first path emits (rather than waiting for all four).
 * `debounceImmediate(20)` in index.ts fires immediately on that first event
 * and then suppresses further events within the 20 ms window.
 *
 * Consequence: if a test pushes several paths synchronously, only the FIRST
 * push is visible to the subscriber; the rest are swallowed by the debounce.
 *
 * Solution: push each path in a separate event-loop tick, separated by at
 * least 25 ms, so each push falls outside the previous debounce window.
 * `testSequential` does this: it spaces pushes 30 ms apart and calls `done`
 * after an additional 30 ms settle delay.
 *
 * The suite has two layers: direct synchronous unit tests that call the
 * encoder's pure `f` (fast, deterministic, no timers, and able to exercise
 * degenerate inputs the stream type forbids), and end-to-end tests that
 * drive `f` through the BaconJS stream + debounce to cover the wiring.
 *
 * Checksums were pre-computed and verified independently.
 */

const deg = (d: number): number => (d * Math.PI) / 180
const msFromKnots = (kn: number): number => (kn * 1852) / 3600

// MISSING sentinel, mirrors the encoder's `defaults`, for direct f() calls.
const MISSING = ''

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Full end-to-end helper: create app, push paths sequentially, assert last.
 */
function testSequential(
  pushes: Array<{ path: string; value: number }>,
  expected: string,
  done: Mocha.Done
): void {
  let last: string | undefined
  const onEmit = (_event: string, value: unknown): void => {
    last = value as string
  }
  const app = createAppWithPlugin(onEmit, 'VHW')

  let i = 0
  function step(): void {
    if (i < pushes.length) {
      const { path, value } = pushes[i++]!
      app.streambundle.getSelfStream(path).push(value)
      setTimeout(step, 30)
    } else {
      setTimeout(() => {
        assert.strictEqual(last, expected)
        done()
      }, 30)
    }
  }
  step()
}

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Direct unit tests: call the encoder's pure `f` synchronously, with no
// stream and no timers. These pin the field-resolution branches, the
// suppression rule, and the non-finite-input handling deterministically.
// ---------------------------------------------------------------------------

describe('VHW encoder (direct)', function () {
  const encoder = vhwFactory({} as unknown as SignalKApp)
  const f = (
    headingTrue: unknown,
    headingMagnetic: unknown,
    magneticVariation: unknown,
    speedThroughWater: unknown
  ): string | undefined =>
    encoder.f(
      headingTrue,
      headingMagnetic,
      magneticVariation,
      speedThroughWater
    )

  describe('field resolution', function () {
    it('uses headingTrue directly; magnetic empty without variation', function () {
      assert.strictEqual(
        f(deg(180), MISSING, MISSING, MISSING),
        '$IIVHW,180.0,T,,M,,N,,K*72'
      )
    })
    it('derives true heading from headingMagnetic + variation', function () {
      assert.strictEqual(
        f(MISSING, deg(170), deg(10), MISSING),
        '$IIVHW,180.0,T,170.0,M,,N,,K*5A'
      )
    })
    it('uses headingMagnetic directly; true empty without variation', function () {
      assert.strictEqual(
        f(MISSING, deg(170), MISSING, MISSING),
        '$IIVHW,,T,170.0,M,,N,,K*7D'
      )
    })
    it('derives magnetic heading from headingTrue - variation', function () {
      assert.strictEqual(
        f(deg(180), MISSING, deg(10), MISSING),
        '$IIVHW,180.0,T,170.0,M,,N,,K*5A'
      )
    })
    it('prefers direct headingMagnetic over the headingTrue-derived value', function () {
      assert.strictEqual(
        f(deg(180), deg(172), deg(10), msFromKnots(10)),
        '$IIVHW,180.0,T,172.0,M,10.00,N,18.52,K*57'
      )
    })
    it('emits zero speed as 0.00 (not suppressed)', function () {
      assert.strictEqual(
        f(MISSING, MISSING, MISSING, 0),
        '$IIVHW,,T,,M,0.00,N,0.00,K*55'
      )
    })
  })

  describe('suppression', function () {
    it('returns undefined when true, magnetic and speed are all absent', function () {
      assert.strictEqual(f(MISSING, MISSING, MISSING, MISSING), undefined)
    })
    it('returns undefined when only magneticVariation is present', function () {
      assert.strictEqual(f(MISSING, MISSING, deg(10), MISSING), undefined)
    })
  })

  describe('non-finite inputs are treated as absent', function () {
    const badValues: Array<[string, unknown]> = [
      ['null', null],
      ['NaN', NaN],
      ['Infinity', Infinity],
      ['a string', 'not-a-number'],
      ['an object', {}]
    ]
    for (const [label, bad] of badValues) {
      it(`blanks the heading field when headingTrue is ${label}, never 0.0/NaN`, function () {
        assert.strictEqual(
          f(bad, MISSING, MISSING, msFromKnots(10)),
          '$IIVHW,,T,,M,10.00,N,18.52,K*5A'
        )
      })
    }
    it('does not let a null variation poison a derived field', function () {
      assert.strictEqual(
        f(deg(180), MISSING, null, MISSING),
        '$IIVHW,180.0,T,,M,,N,,K*72'
      )
    })
    it('treats a null speed as absent (empty speed fields)', function () {
      assert.strictEqual(
        f(MISSING, deg(170), MISSING, null),
        '$IIVHW,,T,170.0,M,,N,,K*7D'
      )
    })
    it('suppresses entirely when every input is non-finite', function () {
      assert.strictEqual(f(null, NaN, Infinity, null), undefined)
    })
  })
})

// ---------------------------------------------------------------------------

describe('VHW', function () {
  // Each test that pushes N paths takes ~(N+1) * 30 ms.
  this.timeout(500)

  // ── Group 1: headingTrue as primary source ───────────────────────────────

  describe('headingTrue as primary source', function () {
    it('emits all fields when headingTrue, magneticVariation, and speedThroughWater are present', (done) => {
      // headingTrue=180°, variation=+10° (easterly), hdgMag=170°, stw=10 kn
      // $IIVHW,180.0,T,170.0,M,10.00,N,18.52,K*55
      testSequential(
        [
          { path: 'navigation.headingTrue', value: deg(180) },
          { path: 'navigation.magneticVariation', value: deg(10) },
          { path: 'navigation.speedThroughWater', value: msFromKnots(10) }
        ],
        '$IIVHW,180.0,T,170.0,M,10.00,N,18.52,K*55',
        done
      )
    })

    it('derives magnetic heading from headingTrue - variation (wraps below 0°)', (done) => {
      // headingTrue=5°, variation=+10° => hdgMag = 5 - 10 = -5° → 355°
      // $IIVHW,5.0,T,355.0,M,10.00,N,18.52,K*5C
      testSequential(
        [
          { path: 'navigation.headingTrue', value: deg(5) },
          { path: 'navigation.magneticVariation', value: deg(10) },
          { path: 'navigation.speedThroughWater', value: msFromKnots(10) }
        ],
        '$IIVHW,5.0,T,355.0,M,10.00,N,18.52,K*5C',
        done
      )
    })

    it('derives magnetic heading from headingTrue - variation (wraps above 360°)', (done) => {
      // headingTrue=355°, variation=-10° (westerly) => hdgMag = 355-(-10) = 365° → 5°
      // $IIVHW,355.0,T,5.0,M,10.00,N,18.52,K*5C
      testSequential(
        [
          { path: 'navigation.headingTrue', value: deg(355) },
          { path: 'navigation.magneticVariation', value: deg(-10) },
          { path: 'navigation.speedThroughWater', value: msFromKnots(10) }
        ],
        '$IIVHW,355.0,T,5.0,M,10.00,N,18.52,K*5C',
        done
      )
    })

    it('leaves magnetic heading empty when headingTrue is present but magneticVariation is absent', (done) => {
      // headingTrue=180°, no variation, no speed — cannot derive hdgMag
      // $IIVHW,180.0,T,,M,,N,,K*72
      testSequential(
        [{ path: 'navigation.headingTrue', value: deg(180) }],
        '$IIVHW,180.0,T,,M,,N,,K*72',
        done
      )
    })

    it('emits with headingTrue + variation but no speed (speed fields empty)', (done) => {
      // headingTrue=180°, variation=+10° => hdgMag=170°, no speed
      // $IIVHW,180.0,T,170.0,M,,N,,K*5A
      testSequential(
        [
          { path: 'navigation.headingTrue', value: deg(180) },
          { path: 'navigation.magneticVariation', value: deg(10) }
        ],
        '$IIVHW,180.0,T,170.0,M,,N,,K*5A',
        done
      )
    })
  })

  // ── Group 2: headingMagnetic as primary source ───────────────────────────

  describe('headingMagnetic as primary source', function () {
    it('emits magnetic heading directly and derives true heading when variation is present', (done) => {
      // hdgMag=170°, variation=+10° => hdgTrue = 170 + 10 = 180°, stw=10 kn
      // $IIVHW,180.0,T,170.0,M,10.00,N,18.52,K*55
      testSequential(
        [
          { path: 'navigation.headingMagnetic', value: deg(170) },
          { path: 'navigation.magneticVariation', value: deg(10) },
          { path: 'navigation.speedThroughWater', value: msFromKnots(10) }
        ],
        '$IIVHW,180.0,T,170.0,M,10.00,N,18.52,K*55',
        done
      )
    })

    it('derives true heading with wrap-around (hdgMag + variation crosses 360°)', (done) => {
      // hdgMag=355°, variation=+10° => hdgTrue = 355 + 10 = 365° → 5°
      // $IIVHW,5.0,T,355.0,M,10.00,N,18.52,K*5C
      testSequential(
        [
          { path: 'navigation.headingMagnetic', value: deg(355) },
          { path: 'navigation.magneticVariation', value: deg(10) },
          { path: 'navigation.speedThroughWater', value: msFromKnots(10) }
        ],
        '$IIVHW,5.0,T,355.0,M,10.00,N,18.52,K*5C',
        done
      )
    })

    it('leaves true heading empty when headingMagnetic is present but variation is absent', (done) => {
      // hdgMag=170°, no variation — cannot derive true heading
      // stw=10 kn still populates speed fields
      // $IIVHW,,T,170.0,M,10.00,N,18.52,K*72
      testSequential(
        [
          { path: 'navigation.headingMagnetic', value: deg(170) },
          { path: 'navigation.speedThroughWater', value: msFromKnots(10) }
        ],
        '$IIVHW,,T,170.0,M,10.00,N,18.52,K*72',
        done
      )
    })

    it('emits with headingMagnetic alone (no variation, no speed)', (done) => {
      // hdgMag=170°, no variation, no speed
      // $IIVHW,,T,170.0,M,,N,,K*7D
      testSequential(
        [{ path: 'navigation.headingMagnetic', value: deg(170) }],
        '$IIVHW,,T,170.0,M,,N,,K*7D',
        done
      )
    })
  })

  // ── Group 3: headingMagnetic takes priority over derived magnetic heading ─

  describe('headingMagnetic priority over headingTrue-derived magnetic', function () {
    it('uses headingMagnetic directly when both headingTrue and headingMagnetic are present', (done) => {
      // headingTrue=180°, hdgMag=172° (direct sensor, differs from derived 170°),
      // variation=+10°, stw=10 kn.
      // True field:     headingTrue=180° (direct).
      // Magnetic field: headingMagnetic=172° (direct, not 180-10=170°).
      // $IIVHW,180.0,T,172.0,M,10.00,N,18.52,K*57
      testSequential(
        [
          { path: 'navigation.headingTrue', value: deg(180) },
          { path: 'navigation.headingMagnetic', value: deg(172) },
          { path: 'navigation.magneticVariation', value: deg(10) },
          { path: 'navigation.speedThroughWater', value: msFromKnots(10) }
        ],
        '$IIVHW,180.0,T,172.0,M,10.00,N,18.52,K*57',
        done
      )
    })
  })

  // ── Group 4: speed-only emission ─────────────────────────────────────────

  describe('speedThroughWater only (no heading inputs)', function () {
    it('emits with speed fields populated and all heading fields empty', (done) => {
      // stw=10 kn, no headings at all
      // $IIVHW,,T,,M,10.00,N,18.52,K*5A
      testSequential(
        [{ path: 'navigation.speedThroughWater', value: msFromKnots(10) }],
        '$IIVHW,,T,,M,10.00,N,18.52,K*5A',
        done
      )
    })
  })

  // ── Group 5: suppression when no useful input is available ───────────────

  describe('suppression', function () {
    it('does not emit when only magneticVariation is present (no heading, no speed)', (done) => {
      let emitted = false
      const onEmit = (): void => {
        emitted = true
      }
      const app = createAppWithPlugin(onEmit, 'VHW')
      app.streambundle
        .getSelfStream('navigation.magneticVariation')
        .push(deg(10))
      setTimeout(() => {
        assert.strictEqual(emitted, false)
        done()
      }, 60)
    })
  })

  // ── Group 6: emission sequence (guard against a wrong transient) ─────────

  describe('emission sequence', function () {
    it('emits a correct partial sentence on each push, never a malformed transient', (done) => {
      const emissions: string[] = []
      const onEmit = (_event: string, value: unknown): void => {
        emissions.push(value as string)
      }
      const app = createAppWithPlugin(onEmit, 'VHW')
      const pushes = [
        { path: 'navigation.headingTrue', value: deg(180) },
        { path: 'navigation.speedThroughWater', value: msFromKnots(10) }
      ]
      let i = 0
      function step(): void {
        if (i < pushes.length) {
          const { path, value } = pushes[i++]!
          app.streambundle.getSelfStream(path).push(value)
          setTimeout(step, 30)
        } else {
          setTimeout(() => {
            assert.deepStrictEqual(emissions, [
              '$IIVHW,180.0,T,,M,,N,,K*72',
              '$IIVHW,180.0,T,,M,10.00,N,18.52,K*7D'
            ])
            done()
          }, 30)
        }
      }
      step()
    })
  })
})
