import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

type AnyApp = ReturnType<typeof createAppWithPlugin>

interface Overrides {
  nextPoint?: { name?: string }
  magneticVariation?: number
  crossTrackError?: number
  bearingTrackTrue?: number
  bearingTrue?: number
}

describe('APB (magnetic)', function () {
  // bearingTrackTrue = 2.1503 rad (123 deg)
  // bearingTrue = 2.1962 rad (126 deg)
  // magneticVariation = -0.16 rad (-9.17 deg, westerly)
  // magnetic = true - variation = true + 9.17
  // bearingTrackMag = 132 deg, bearingMag = 135 deg
  const realXte = -39.84
  const realBearingTrackTrue = 2.1503
  const realBearingTrue = 2.1962
  const realVariation = -0.16

  function pushStreams(app: AnyApp, overrides?: Overrides): void {
    if (overrides && 'nextPoint' in overrides) {
      app.streambundle
        .getSelfStream('navigation.course.nextPoint')
        .push(overrides.nextPoint)
    }
    app.streambundle
      .getSelfStream('navigation.magneticVariation')
      .push((overrides && overrides.magneticVariation) ?? realVariation)
    app.streambundle
      .getSelfStream('navigation.course.calcValues.crossTrackError')
      .push((overrides && overrides.crossTrackError) ?? realXte)
    app.streambundle
      .getSelfStream('navigation.course.calcValues.bearingTrackTrue')
      .push((overrides && overrides.bearingTrackTrue) ?? realBearingTrackTrue)
    app.streambundle
      .getSelfStream('navigation.course.calcValues.bearingTrue')
      .push((overrides && overrides.bearingTrue) ?? realBearingTrue)
  }

  function parseApb(sentence: string): Record<string, string | undefined> {
    const body = sentence.split('*')[0]!
    const parts = body.split(',')
    return {
      talker: parts[0],
      xteMagnitude: parts[3],
      steerDirection: parts[4],
      bearingOriginToDest: parts[8],
      bearingOriginToDestRef: parts[9],
      waypointId: parts[10],
      bearingPosToDest: parts[11],
      bearingPosToDestRef: parts[12],
      headingToSteer: parts[13],
      headingToSteerRef: parts[14]
    }
  }

  it('uses Magnetic reference for all three bearing pairs', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseApb(value as string)
      assert.equal(fields.bearingOriginToDestRef, 'M', 'field 9')
      assert.equal(fields.bearingPosToDestRef, 'M', 'field 12')
      assert.equal(fields.headingToSteerRef, 'M', 'field 14')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB')
    pushStreams(app)
  })

  it('computes magnetic bearings from true and variation', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseApb(value as string)
      assert.equal(fields.bearingOriginToDest, '132')
      assert.equal(fields.bearingPosToDest, '135')
      assert.equal(fields.headingToSteer, '135')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB')
    pushStreams(app)
  })

  it('computes correct XTE and steer direction', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseApb(value as string)
      assert.equal(fields.steerDirection, 'R', 'negative XTE = steer right')
      assert.equal(fields.xteMagnitude, '0.022')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB')
    pushStreams(app)
  })

  it('uses waypoint name from nextPoint', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseApb(value as string)
      assert.equal(fields.waypointId, 'NASSAU')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB')
    pushStreams(app, { nextPoint: { name: 'NASSAU' } })
  })

  it('wraps magnetic bearing near 360', (done) => {
    // bearingTrue = 355 deg, variation = -10 deg (westerly)
    // magnetic = 355 - (-10) = 365 -> wraps to 5 deg
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseApb(value as string)
      assert.equal(fields.headingToSteer, '5')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB')
    pushStreams(app, {
      bearingTrackTrue: (350 * Math.PI) / 180,
      bearingTrue: (355 * Math.PI) / 180,
      magneticVariation: (-10 * Math.PI) / 180
    })
  })
})
