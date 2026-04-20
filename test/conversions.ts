import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

describe('conversions array config', function () {
  // New-format config: basic emission
  it('emits a sentence when configured via the conversions array', function (done) {
    const onEmit = (_event: string, value: unknown): void => {
      assert.ok(
        typeof value === 'string' && value.startsWith('$IIDBT,'),
        `expected DBT sentence, got ${String(value)}`
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, [{ sentence: 'DBT' }])
    app.streambundle.getSelfStream('environment.depth.belowTransducer').push(10)
  })

  // New-format config: throttle
  it('applies throttle from the conversions array', function (done) {
    this.timeout(2000)
    let count = 0
    const onEmit = (): void => {
      count++
    }
    const app = createAppWithPlugin(onEmit, [
      { sentence: 'HDM', throttle: 200 }
    ])
    const stream = app.streambundle.getSelfStream('navigation.headingMagnetic')
    for (let i = 0; i < 10; i++) stream.push(0.5 + i * 0.01)
    setTimeout(() => {
      try {
        assert.ok(
          count <= 1,
          `expected <=1 emission with 200ms throttle, got ${count}`
        )
        assert.ok(count >= 1, `expected >=1 emission, got ${count}`)
        done()
      } catch (e) {
        done(e)
      }
    }, 250)
  })

  // Custom event name
  it('emits on a custom event when configured', function (done) {
    const onEmit = (): void => {}
    const app = createAppWithPlugin(onEmit, [
      { sentence: 'DBT', event: 'mySerialPort' }
    ])
    app.streambundle.getSelfStream('environment.depth.belowTransducer').push(10)
    setTimeout(() => {
      try {
        const customEvents = app.emittedEvents.filter(
          (e) => e.name === 'mySerialPort'
        )
        assert.strictEqual(
          customEvents.length,
          1,
          'expected 1 custom event emission'
        )
        const value = customEvents[0]!.value
        assert.ok(
          typeof value === 'string' && value.startsWith('$IIDBT,'),
          `expected DBT sentence on custom event, got ${String(value)}`
        )
        done()
      } catch (e) {
        done(e)
      }
    }, 50)
  })

  // Standard per-sentence event (g{SENTENCE}) still fires
  it('emits the standard g{sentence} event for modules that define a sentence id', function (done) {
    const onEmit = (): void => {}
    const app = createAppWithPlugin(onEmit, [{ sentence: 'DBT' }])
    app.streambundle.getSelfStream('environment.depth.belowTransducer').push(10)
    setTimeout(() => {
      try {
        const gEvents = app.emittedEvents.filter((e) => e.name === 'gDBT')
        assert.ok(
          gEvents.length >= 1,
          `expected gDBT event, got ${gEvents.length}`
        )
        done()
      } catch (e) {
        done(e)
      }
    }, 50)
  })

  // Module without a sentence property should not emit a g{sentence} event
  it('does not emit a g{sentence} event for modules without a sentence id', function (done) {
    const onEmit = (): void => {}
    const app = createAppWithPlugin(onEmit, [{ sentence: 'ZDA' }])
    app.streambundle
      .getSelfStream('navigation.datetime')
      .push('2025-04-27T14:30:00Z')
    setTimeout(() => {
      try {
        // ZDA module does not define a .sentence property, so no gXXX event.
        const gEvents = app.emittedEvents.filter((e) => e.name.startsWith('g'))
        assert.strictEqual(
          gEvents.length,
          0,
          `unexpected g-event: ${JSON.stringify(gEvents)}`
        )
        done()
      } catch (e) {
        done(e)
      }
    }, 50)
  })

  // Legacy config migration: boolean flags
  it('migrates legacy boolean config to the conversions format', function (done) {
    const onEmit = (_event: string, value: unknown): void => {
      assert.ok(
        typeof value === 'string' && value.startsWith('$IIDBT,'),
        `expected DBT sentence, got ${String(value)}`
      )
      done()
    }
    // Old format: { DBT: true }
    const app = createAppWithPlugin(onEmit, { DBT: true })
    app.streambundle.getSelfStream('environment.depth.belowTransducer').push(10)
  })

  // Legacy config migration: throttle preserved
  it('preserves throttle values during legacy migration', function (done) {
    this.timeout(2000)
    let count = 0
    const onEmit = (): void => {
      count++
    }
    // Old format with throttle
    const app = createAppWithPlugin(onEmit, {
      HDM: true,
      HDM_throttle: 200
    })
    const stream = app.streambundle.getSelfStream('navigation.headingMagnetic')
    for (let i = 0; i < 10; i++) stream.push(0.5 + i * 0.01)
    setTimeout(() => {
      try {
        assert.ok(
          count <= 1,
          `expected <=1 emission with 200ms throttle, got ${count}`
        )
        assert.ok(count >= 1, `expected >=1 emission, got ${count}`)
        done()
      } catch (e) {
        done(e)
      }
    }, 250)
  })

  // Empty conversions array
  it('starts cleanly with an empty conversions array', function () {
    const onEmit = (): void => {
      assert.fail('should not emit anything')
    }
    createAppWithPlugin(onEmit, { conversions: [] })
  })

  // Invalid sentence name
  it('skips unknown sentence names without crashing', function (done) {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, [
      { sentence: 'NONEXISTENT' },
      { sentence: 'DBT' }
    ])
    app.streambundle.getSelfStream('environment.depth.belowTransducer').push(10)
    setTimeout(() => {
      try {
        assert.ok(emitted, 'valid sentence should still emit')
        done()
      } catch (e) {
        done(e)
      }
    }, 50)
  })

  // Duplicate sentences: each creates an independent stream
  it('handles duplicate sentences independently', function (done) {
    let count = 0
    const onEmit = (): void => {
      count++
    }
    const app = createAppWithPlugin(onEmit, [
      { sentence: 'DBT' },
      { sentence: 'DBT' }
    ])
    app.streambundle.getSelfStream('environment.depth.belowTransducer').push(10)
    setTimeout(() => {
      try {
        assert.strictEqual(
          count,
          2,
          'expected 2 emissions from duplicate entries'
        )
        done()
      } catch (e) {
        done(e)
      }
    }, 50)
  })

  // No throttle property: debounceImmediate(20) is always active, but without
  // an explicit throttle the stream should still emit more than once after the
  // debounce window passes.
  it('emits without throttling when throttle is omitted', function (done) {
    this.timeout(2000)
    let count = 0
    const onEmit = (): void => {
      count++
    }
    const app = createAppWithPlugin(onEmit, [{ sentence: 'HDM' }])
    const stream = app.streambundle.getSelfStream('navigation.headingMagnetic')
    stream.push(0.5)
    setTimeout(() => {
      stream.push(0.6)
      setTimeout(() => {
        try {
          assert.strictEqual(
            count,
            2,
            `expected 2 emissions without throttle, got ${count}`
          )
          done()
        } catch (e) {
          done(e)
        }
      }, 50)
    }, 50)
  })
})
