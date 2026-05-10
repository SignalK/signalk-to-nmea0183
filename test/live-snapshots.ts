/*
 * Live-snapshot regression tests.
 *
 * The scenario data inlined below is extracted from deltastream
 * snapshots captured against a running signalk-server (2.26.0) and
 * covers the three navigation modes a chartplotter / autopilot user
 * can be in:
 *
 *   1. navigate-to-point     - direct to a position, no waypoint, no route
 *   2. navigate-to-waypoint  - direct to a saved waypoint, no route
 *   3. active-route          - multi-point route active, currently at point 1
 *
 * Each scenario asserts the routing sentences (RMB, APB, APB-true, XTE)
 * against the captured state. Pushes are ordered context-first (paths
 * with a default in the encoder) then trigger-last so the combined
 * stream's first fire already has all context populated.
 *
 * Full snapshots are kept under test/snapshots/ for diagnostic re-runs
 * via scripts/probe-snapshot.ts; new scenarios can be captured with
 * scripts/capture-snapshot.ts. Only the routing-relevant subset of
 * paths is inlined here so the tests are self-contained.
 */
import * as Bacon from 'baconjs'
import * as assert from 'assert'

interface Scenario {
  name: string
  paths: Record<string, unknown>
}

const SCENARIO_NO_WAYPOINT: Scenario = {
  name: 'navigate-to-point (no waypoint, no route)',
  paths: {
    'navigation.course.calcValues.crossTrackError': 2.5441476328008386,
    'navigation.course.calcValues.bearingTrackTrue': 4.831171944671482,
    'navigation.course.calcValues.bearingTrue': 4.823602533829535,
    'navigation.course.calcValues.distance': 336.1154538639113,
    'navigation.course.calcValues.velocityMadeGood': 0,
    'navigation.course.nextPoint': {
      position: {
        latitude: 26.54696714586578,
        longitude: -77.06287980079651
      },
      type: 'Location'
    },
    'navigation.course.previousPoint': {
      position: {
        latitude: 26.546606666666666,
        longitude: -77.05950333333334
      },
      type: 'VesselPosition'
    },
    'navigation.course.activeRoute': null,
    'navigation.magneticVariation': -0.16089135395421264
  }
}

const SCENARIO_WAYPOINT: Scenario = {
  name: 'navigate-to-waypoint (saved waypoint, no route)',
  paths: {
    'navigation.course.calcValues.crossTrackError': -0.20313368473614887,
    'navigation.course.calcValues.bearingTrackTrue': 4.827445107318298,
    'navigation.course.calcValues.bearingTrue': 4.828220941657066,
    'navigation.course.calcValues.distance': 261.8239416044419,
    'navigation.course.calcValues.velocityMadeGood': 0,
    'navigation.course.nextPoint': {
      position: {
        latitude: 26.547003799661532,
        longitude: -77.06213951110841
      },
      href: '/resources/waypoints/c9dc41b2-1bce-4e7d-80f2-882aca7a3eae',
      type: 'Waypoint'
    },
    'navigation.course.previousPoint': {
      position: {
        latitude: 26.546733333333332,
        longitude: -77.05952333333333
      },
      type: 'VesselPosition'
    },
    'navigation.course.activeRoute': null,
    'navigation.magneticVariation': -0.16089135395421264
  }
}

const SCENARIO_ROUTE: Scenario = {
  name: 'active multi-point route, at point 1 of 3',
  paths: {
    'navigation.course.calcValues.crossTrackError': 0.18524218386861044,
    'navigation.course.calcValues.bearingTrackTrue': 4.682498620978,
    'navigation.course.calcValues.bearingTrue': 4.682038884004606,
    'navigation.course.calcValues.distance': 402.9308132880701,
    'navigation.course.calcValues.velocityMadeGood': 0,
    'navigation.course.nextPoint': {
      type: 'RoutePoint',
      position: {
        latitude: 26.54661003894277,
        longitude: -77.06357717514038
      }
    },
    'navigation.course.previousPoint': {
      position: {
        latitude: 26.546718333333335,
        longitude: -77.05952833333333
      },
      type: 'VesselPosition'
    },
    'navigation.course.activeRoute': {
      href: '/resources/routes/c1551d44-65dc-409d-b09a-7482202cc2a1',
      name: 'Route 20260508 (2)',
      reverse: false,
      pointIndex: 0,
      pointTotal: 3
    },
    'navigation.magneticVariation': -0.16089135395421264
  }
}

interface MockApp {
  streambundle: { getSelfStream: (p: string) => Bacon.Bus<unknown> }
  emit: (n: string, v: unknown) => void
  debug: (m: unknown) => void
  reportOutputMessages?: (n: number) => void
}

function runEncoder(
  encoderName: string,
  scenario: Scenario,
  delayMs: number = 80
): Promise<{ emissions: string[] }> {
  const streams: Record<string, Bacon.Bus<unknown>> = {}
  const emissions: string[] = []
  const app: MockApp = {
    streambundle: {
      getSelfStream: (p: string): Bacon.Bus<unknown> => {
        if (!streams[p]) streams[p] = new Bacon.Bus<unknown>()
        return streams[p]!
      }
    },
    emit: (n: string, v: unknown): void => {
      if (n === 'nmea0183out') emissions.push(String(v))
    },
    debug: (): void => {}
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const factory = require('../src/index')
  const plugin = factory(app)
  const encoder = plugin.sentences[encoderName]
  if (!encoder) {
    throw new Error('encoder not registered: ' + encoderName)
  }
  plugin.start({ [encoderName]: true })

  const keys = encoder.keys as string[]
  const defaults = (encoder.defaults || []) as unknown[]
  // Push context paths (with a default) first, then trigger paths (no
  // default). The combined stream first fire then has all context
  // already populated.
  const order = [
    ...keys.filter((_k, i) => defaults[i] !== undefined),
    ...keys.filter((_k, i) => defaults[i] === undefined)
  ]
  for (const p of order) {
    if (p in scenario.paths) {
      streams[p]!.push(scenario.paths[p])
    }
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      plugin.stop()
      resolve({ emissions })
    }, delayMs)
  })
}

describe('live signalk-server snapshots: routing sentences', function () {
  this.timeout(5000)

  describe('Scenario 1: ' + SCENARIO_NO_WAYPOINT.name, function () {
    const s = SCENARIO_NO_WAYPOINT

    it('RMB field 4 contains "DP"', async function () {
      const { emissions } = await runEncoder('RMB', s)
      assert.ok(emissions.length > 0, 'RMB must emit')
      const last = emissions[emissions.length - 1]!
      assert.match(last, /^\$IIRMB,A,/)
      const fields = last.split(',')
      assert.strictEqual(fields[4], 'DP')
    })

    it('APB field 10 contains "DP"', async function () {
      const { emissions } = await runEncoder('APB', s)
      assert.ok(emissions.length > 0)
      const fields = emissions[emissions.length - 1]!.split(',')
      assert.strictEqual(fields[10], 'DP')
    })

    it('APB-true field 10 contains "DP"', async function () {
      const { emissions } = await runEncoder('APB-true', s)
      assert.ok(emissions.length > 0)
      const fields = emissions[emissions.length - 1]!.split(',')
      assert.strictEqual(fields[10], 'DP')
    })

    it('XTE emits a cross-track error sentence', async function () {
      const { emissions } = await runEncoder('XTE', s)
      assert.ok(emissions.length > 0)
      assert.match(emissions[0]!, /^\$IIXTE,A,A,/)
    })
  })

  describe('Scenario 2: ' + SCENARIO_WAYPOINT.name, function () {
    const s = SCENARIO_WAYPOINT

    it('RMB field 4 contains "WP1"', async function () {
      const { emissions } = await runEncoder('RMB', s)
      assert.ok(emissions.length > 0, 'RMB must emit')
      const last = emissions[emissions.length - 1]!
      assert.match(last, /^\$IIRMB,A,/)
      const fields = last.split(',')
      assert.strictEqual(fields[4], 'WP1')
    })

    it('APB field 10 contains "WP1"', async function () {
      const { emissions } = await runEncoder('APB', s)
      assert.ok(emissions.length > 0)
      const fields = emissions[emissions.length - 1]!.split(',')
      assert.strictEqual(fields[10], 'WP1')
    })

    it('APB-true field 10 contains "WP1"', async function () {
      const { emissions } = await runEncoder('APB-true', s)
      assert.ok(emissions.length > 0)
      const fields = emissions[emissions.length - 1]!.split(',')
      assert.strictEqual(fields[10], 'WP1')
    })

    it('XTE emits a cross-track error sentence', async function () {
      const { emissions } = await runEncoder('XTE', s)
      assert.ok(emissions.length > 0)
      assert.match(emissions[0]!, /^\$IIXTE,A,A,/)
    })
  })

  describe('Scenario 3: ' + SCENARIO_ROUTE.name, function () {
    const s = SCENARIO_ROUTE

    it('RMB field 4 contains "WP1"', async function () {
      const { emissions } = await runEncoder('RMB', s)
      assert.ok(emissions.length > 0, 'RMB must emit')
      const last = emissions[emissions.length - 1]!
      assert.match(last, /^\$IIRMB,A,/)
      const fields = last.split(',')
      assert.strictEqual(fields[4], 'WP1')
    })

    it('APB field 10 contains "WP1"', async function () {
      const { emissions } = await runEncoder('APB', s)
      assert.ok(emissions.length > 0)
      const fields = emissions[emissions.length - 1]!.split(',')
      assert.strictEqual(fields[10], 'WP1')
    })

    it('APB-true field 10 contains "WP1"', async function () {
      const { emissions } = await runEncoder('APB-true', s)
      assert.ok(emissions.length > 0)
      const fields = emissions[emissions.length - 1]!.split(',')
      assert.strictEqual(fields[10], 'WP1')
    })

    it('XTE emits a cross-track error sentence', async function () {
      const { emissions } = await runEncoder('XTE', s)
      assert.ok(emissions.length > 0)
      assert.match(emissions[0]!, /^\$IIXTE,A,A,/)
    })
  })
})
