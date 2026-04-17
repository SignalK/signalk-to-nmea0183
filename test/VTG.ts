import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

type AnyApp = ReturnType<typeof createAppWithPlugin>

function parseSentence(sentence: string): string[] {
  const star = sentence.indexOf('*')
  const body = star >= 0 ? sentence.substring(0, star) : sentence
  return body.split(',')
}

function pushVTG(
  app: AnyApp,
  cogMagRad: number,
  cogTrueRad: number,
  sogMs: number
): void {
  app.streambundle
    .getSelfStream('navigation.courseOverGroundMagnetic')
    .push(cogMagRad)
  app.streambundle
    .getSelfStream('navigation.courseOverGroundTrue')
    .push(cogTrueRad)
  app.streambundle.getSelfStream('navigation.speedOverGround').push(sogMs)
}

describe('VTG', function () {
  it('emits COG true, COG magnetic, SOG in knots and km/h', (done) => {
    // COG true = 90 deg, COG mag = 80 deg, SOG = 5 m/s
    const onEmit = (_event: string, value: unknown): void => {
      const parts = parseSentence(value as string)
      assert.equal(parts[0], '$IIVTG')
      assert.equal(parts[1], '90.00')
      assert.equal(parts[2], 'T')
      assert.equal(parts[3], '80.00')
      assert.equal(parts[4], 'M')
      assert.equal(parts[9], 'A')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VTG')
    pushVTG(app, (80 * Math.PI) / 180, Math.PI / 2, 5)
  })

  it('produces positive degrees for negative radian COG inputs', (done) => {
    // COG true = -10 deg (= 350 deg), COG mag = -20 deg (= 340 deg)
    const onEmit = (_event: string, value: unknown): void => {
      const parts = parseSentence(value as string)
      assert.equal(parts[1], '350.00')
      assert.equal(parts[3], '340.00')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VTG')
    pushVTG(app, (-20 * Math.PI) / 180, (-10 * Math.PI) / 180, 5)
  })
})
