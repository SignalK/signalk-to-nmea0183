import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

type AnyApp = ReturnType<typeof createAppWithPlugin>

// Parse the comma-separated body of an NMEA sentence and strip the checksum
// from the final field.
// Input:  "$IIVWT,90.00,R,3.89,N,2.00,M,7.20,K*73"
// Output: ["$IIVWT", "90.00", "R", "3.89", "N", "2.00", "M", "7.20", "K"]
function parseSentence(sentence: string): string[] {
  const star = sentence.indexOf('*')
  const body = star >= 0 ? sentence.substring(0, star) : sentence
  return body.split(',')
}

function pushVWT(app: AnyApp, angleRad: number, speedMs: number): void {
  app.streambundle
    .getSelfStream('environment.wind.angleTrueWater')
    .push(angleRad)
  app.streambundle.getSelfStream('environment.wind.speedTrue').push(speedMs)
}

describe('VWT', function () {
  it('emits a VWT sentence with the expected layout', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const s = value as string
      const parts = parseSentence(s)
      assert.equal(parts[0], '$IIVWT')
      assert.equal(parts.length, 9, 'expected 9 comma-separated fields')
      assert.equal(parts[4], 'N')
      assert.equal(parts[6], 'M')
      assert.equal(parts[8], 'K')
      assert.match(s, /\*[0-9A-F]{2}$/, 'expected trailing *HH checksum')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VWT')
    pushVWT(app, Math.PI / 2, 2)
  })

  it('converts true wind speed to knots, m/s and km/h', (done) => {
    // 2 m/s -> 3.89 kn, 2.00 m/s, 7.20 km/h
    const onEmit = (_event: string, value: unknown): void => {
      const parts = parseSentence(value as string)
      assert.equal(parts[3], '3.89')
      assert.equal(parts[5], '2.00')
      assert.equal(parts[7], '7.20')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VWT')
    pushVWT(app, Math.PI / 2, 2)
  })

  it('handles a different speed value', (done) => {
    // 5.14 m/s ~ 10 knots
    const onEmit = (_event: string, value: unknown): void => {
      const parts = parseSentence(value as string)
      assert.equal(parts[3], '9.99')
      assert.equal(parts[5], '5.14')
      assert.equal(parts[7], '18.50')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VWT')
    pushVWT(app, Math.PI / 2, 5.14)
  })

  // Regression tests for SignalK/signalk-to-nmea0183#36.
  // NMEA 0183 VWT expects a magnitude 0..180 followed by L (port) or R
  // (starboard). Signal K delivers environment.wind.angleTrueWater as
  // signed radians, negative to port (see specification/schemas/groups/
  // environment.json). The encoder must map the sign to L/R and emit the
  // absolute angle in degrees, not the raw signed value.

  it('reports starboard wind with R and a positive angle', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const parts = parseSentence(value as string)
      assert.equal(parts[1], '45.00')
      assert.equal(parts[2], 'R')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VWT')
    pushVWT(app, Math.PI / 4, 2)
  })

  it('reports port wind with L and a positive angle', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const parts = parseSentence(value as string)
      assert.equal(parts[1], '45.00')
      assert.equal(parts[2], 'L')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VWT')
    pushVWT(app, -Math.PI / 4, 2)
  })

  it('reports head-on wind (0 rad) with a 0 angle and R', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const parts = parseSentence(value as string)
      assert.equal(parts[1], '0.00')
      assert.equal(parts[2], 'R')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VWT')
    pushVWT(app, 0, 2)
  })

  it('reports astern wind (pi rad) with a 180 angle', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const parts = parseSentence(value as string)
      assert.equal(parts[1], '180.00')
      assert.match(parts[2]!, /^[LR]$/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VWT')
    pushVWT(app, Math.PI, 2)
  })

  it('reports beam wind 90deg starboard with R', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const parts = parseSentence(value as string)
      assert.equal(parts[1], '90.00')
      assert.equal(parts[2], 'R')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VWT')
    pushVWT(app, Math.PI / 2, 2)
  })

  it('reports beam wind 90deg port with L', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const parts = parseSentence(value as string)
      assert.equal(parts[1], '90.00')
      assert.equal(parts[2], 'L')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VWT')
    pushVWT(app, -Math.PI / 2, 2)
  })
})
