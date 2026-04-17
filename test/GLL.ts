import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

describe('GLL', function () {
  // Multi-input sentence with NO defaults. Exercises combineStreamsWith with
  // multiple non-defaulted streams — both inputs are plain Buses, the helper's
  // chained .combine path is what produces the Property the downstream
  // .changes() needs.
  it('emits position once both datetime and position have been pushed', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      // Format: $GPGLL,lat,N|S,lon,E|W,hhmmss.ss,A*<checksum>
      // Position 47.5/8.5 → 4730.0000,N,00830.0000,E
      assert.match(
        value as string,
        /^\$GPGLL,4730\.0000,N,00830\.0000,E,\d{6}\.\d{2},A\*[0-9A-F]{2}$/
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'GLL')
    app.streambundle
      .getSelfStream('navigation.datetime')
      .push('2025-01-01T12:34:56Z')
    app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: 8.5, latitude: 47.5 })
  })

  it('produces correct sentence with UTC datetime', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$GPGLL,5943.4970,N,02444.1983,E,200001.00,A*03')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'GLL')
    app.streambundle
      .getSelfStream('navigation.datetime')
      .push('2015-12-05T20:00:01Z')
    app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: 24.736638, latitude: 59.72495 })
  })

  it('converts timezone-offset input to UTC', (done) => {
    // 14:34:56+02:00 = 12:34:56 UTC
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$GPGLL,5943.4970,N,02444.1983,E,123456.00,A*07')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'GLL')
    app.streambundle
      .getSelfStream('navigation.datetime')
      .push('2025-04-27T14:34:56+02:00')
    app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: 24.736638, latitude: 59.72495 })
  })

  it('includes fractional seconds from input', (done) => {
    // 789ms = 78 centiseconds
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$GPGLL,5943.4970,N,02444.1983,E,123456.78,A*08')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'GLL')
    app.streambundle
      .getSelfStream('navigation.datetime')
      .push('2025-04-27T12:34:56.789Z')
    app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: 24.736638, latitude: 59.72495 })
  })

  it('does not emit when position is null', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'GLL')
    app.streambundle
      .getSelfStream('navigation.datetime')
      .push('2025-04-27T12:34:56Z')
    app.streambundle.getSelfStream('navigation.position').push(null)
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })
})
