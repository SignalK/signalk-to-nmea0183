/**
 * Covers how the plugin reports encoder problems on the server log.
 *
 * A sentence encoder runs once per combined-stream emission, so anything
 * logged unconditionally from the failure path is repeated several times
 * a second on a live feed. These tests pin the contract: the first
 * failure is an error naming the sentence, everything after it is debug.
 */
import * as assert from 'assert'

import pluginFactory from '../src/index'
import type { SignalKPlugin } from '../src/types/plugin'
import { createTestApp } from './testutil'

/** Start the plugin with `sentences` merged into the built-in registry. */
function startWithEncoders(
  sentences: SignalKPlugin['sentences'],
  conversions: Array<{ sentence: string }>
): ReturnType<typeof createTestApp> {
  const app = createTestApp(() => {})
  const plugin = pluginFactory(
    app as unknown as Parameters<typeof pluginFactory>[0]
  ) as SignalKPlugin
  Object.assign(plugin.sentences, sentences)
  plugin.start({ conversions }, () => {})
  return app
}

describe('encoder failure reporting', function () {
  it('reports the first failure once, naming the sentence', (done) => {
    const app = startWithEncoders(
      {
        BOOM: {
          sentence: 'BOOM',
          title: 'BOOM - always throws',
          keys: ['environment.depth.belowTransducer'],
          f: (): string => {
            throw new Error('kaboom')
          }
        }
      },
      [{ sentence: 'BOOM' }]
    )

    const stream = app.streambundle.getSelfStream(
      'environment.depth.belowTransducer'
    )
    stream.push(1)
    stream.push(2)
    stream.push(3)

    setTimeout(() => {
      assert.deepEqual(app.loggedErrors, ['BOOM encoder failed: kaboom'])
      assert.deepEqual(
        app.debugMessages.filter((m) => m.includes('kaboom')),
        ['BOOM encoder failed: kaboom', 'BOOM encoder failed: kaboom']
      )
      done()
    }, 50)
  })

  it('reports an unknown sentence and starts the remaining conversions', (done) => {
    const app = startWithEncoders({}, [
      { sentence: 'NOSUCH' },
      { sentence: 'DBT' }
    ])

    app.streambundle.getSelfStream('environment.depth.belowTransducer').push(10)

    setTimeout(() => {
      assert.deepEqual(app.loggedErrors, [
        'unknown sentence "NOSUCH", skipping'
      ])
      assert.ok(
        app.emittedEvents.some(
          (e) =>
            e.name === 'nmea0183out' &&
            typeof e.value === 'string' &&
            e.value.startsWith('$IIDBT,')
        ),
        'DBT should still be converted'
      )
      done()
    }, 50)
  })
})
