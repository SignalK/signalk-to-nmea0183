import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

type AnyApp = ReturnType<typeof createAppWithPlugin>

// Parse the comma-separated body of an NMEA sentence, stripping the checksum.
function parseSentence(sentence: string): string[] {
  const star = sentence.indexOf('*')
  const body = star >= 0 ? sentence.substring(0, star) : sentence
  return body.split(',')
}

function pushMWD(
  app: AnyApp,
  directionTrueRad: number,
  variationRad: number,
  speedTrueMs: number
): void {
  app.streambundle
    .getSelfStream('environment.wind.directionTrue')
    .push(directionTrueRad)
  app.streambundle
    .getSelfStream('navigation.magneticVariation')
    .push(variationRad)
  app.streambundle.getSelfStream('environment.wind.speedTrue').push(speedTrueMs)
}

describe('MWD', function () {
  it('emits true and magnetic direction with speed in knots and m/s', (done) => {
    // directionTrue = 90 deg, variation = 10 deg east
    // directionMagnetic = 90 - 10 = 80 deg
    const onEmit = (_event: string, value: unknown): void => {
      const parts = parseSentence(value as string)
      assert.equal(parts[0], '$IIMWD')
      assert.equal(parts[1], '90.00')
      assert.equal(parts[2], 'T')
      assert.equal(parts[3], '80.00')
      assert.equal(parts[4], 'M')
      assert.equal(parts[6], 'N')
      assert.equal(parts[8], 'M')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'MWD')
    pushMWD(app, Math.PI / 2, (10 * Math.PI) / 180, 5)
  })

  it('produces positive magnetic direction when variation exceeds true direction', (done) => {
    // directionTrue = 5 deg, variation = 10 deg east
    // directionMagnetic = 5 - 10 = -5 deg -> must be 355 deg (not -5)
    const onEmit = (_event: string, value: unknown): void => {
      const parts = parseSentence(value as string)
      assert.equal(parts[1], '5.00')
      assert.equal(parts[3], '355.00')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'MWD')
    pushMWD(app, (5 * Math.PI) / 180, (10 * Math.PI) / 180, 5)
  })

  it('wraps magnetic direction when true near 360 and variation is westerly', (done) => {
    // directionTrue = 355 deg (6.196 rad), variation = -10 deg (-0.175 rad)
    // raw magnetic = 355 - (-10) = 365 deg (> 2*PI), fixAngle wraps to 5 deg
    const onEmit = (_event: string, value: unknown): void => {
      const parts = parseSentence(value as string)
      assert.equal(parts[1], '355.00')
      assert.equal(parts[3], '5.00')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'MWD')
    pushMWD(app, (355 * Math.PI) / 180, (-10 * Math.PI) / 180, 5)
  })

  it('produces positive true direction for negative radian input', (done) => {
    // directionTrue = -10 deg (equivalent to 350 deg), variation = 0
    const onEmit = (_event: string, value: unknown): void => {
      const parts = parseSentence(value as string)
      assert.equal(parts[1], '350.00')
      assert.equal(parts[3], '350.00')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'MWD')
    pushMWD(app, (-10 * Math.PI) / 180, 0, 5)
  })
})
