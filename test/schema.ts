import * as assert from 'assert'
import * as Bacon from 'baconjs'
import type {
  SignalKApp,
  SignalKPlugin,
  SignalKPluginSchema
} from '../src/types/plugin'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const createPlugin = require('../src/index') as (
  app: SignalKApp
) => SignalKPlugin

// `SignalKApp` extends the full `ServerAPI` surface; the schema tests
// only need the handful of methods `buildSchema` reaches through, so
// the stub is intentionally narrow and cast through `unknown`.
function buildStubApp(
  getSelfPath: (path: string) => unknown = () => null
): SignalKApp {
  return {
    streambundle: {
      getSelfStream: () => new Bacon.Bus()
    },
    emit: (): void => {},
    debug: (): void => {},
    getSelfPath
  } as unknown as SignalKApp
}

// Shape of the nested `conversions` array schema. tsc's loose
// `SignalKPluginSchemaProperty` intentionally makes `items`, `oneOf`,
// etc. optional; these helpers narrow in one place so each assertion
// doesn't have to non-null-assert its way down.
function conversionsProp(schema: SignalKPluginSchema) {
  const conv = schema.properties.conversions
  assert.ok(conv, 'schema missing conversions property')
  return conv!
}

function oneOfEntries(
  schema: SignalKPluginSchema
): Array<{ const: string; title: string }> {
  const items = conversionsProp(schema).items
  assert.ok(items, 'conversions schema missing items')
  const sentenceProp = items!.properties?.sentence
  assert.ok(sentenceProp, 'items schema missing sentence property')
  const oneOf = sentenceProp!.oneOf
  assert.ok(oneOf, 'sentence schema missing oneOf')
  return oneOf!
}

describe('schema', function () {
  let plugin: SignalKPlugin
  let schema: SignalKPluginSchema

  before(function () {
    plugin = createPlugin(buildStubApp())
    schema = plugin.schema()
  })

  it('has a conversions array property', function () {
    const conv = conversionsProp(schema)
    assert.strictEqual(conv.type, 'array')
    assert.strictEqual(conv.title, 'Active Conversions')
  })

  it('defines array items as objects with sentence, throttle, and event', function () {
    const items = conversionsProp(schema).items!
    const props = items.properties!
    assert.ok(props.sentence, 'missing sentence property')
    assert.ok(props.throttle, 'missing throttle property')
    assert.ok(props.event, 'missing event property')
    assert.strictEqual(props.throttle!.type, 'number')
    assert.strictEqual(props.event!.type, 'string')
  })

  it('requires the sentence field', function () {
    const required = conversionsProp(schema).items!.required
    assert.deepStrictEqual(required, ['sentence'])
  })

  it('provides a oneOf entry for every loaded sentence module', function () {
    const oneOf = oneOfEntries(schema)
    const sentenceCount = Object.keys(plugin.sentences).length
    assert.strictEqual(oneOf.length, sentenceCount)
  })

  it('sorts oneOf entries alphabetically by sentence key', function () {
    const oneOf = oneOfEntries(schema)
    const keys = oneOf.map((entry) => entry.const)
    const sorted = [...keys].sort()
    assert.deepStrictEqual(keys, sorted)
  })

  it('each oneOf entry has const and title with path indicators', function () {
    const oneOf = oneOfEntries(schema)
    oneOf.forEach((entry) => {
      assert.ok(
        entry.const,
        `missing const for entry: ${JSON.stringify(entry)}`
      )
      assert.ok(entry.title, `missing title for entry: ${entry.const}`)
      assert.ok(
        entry.title.includes('[') && entry.title.includes(']'),
        `title missing path indicators for entry: ${entry.const}`
      )
    })
  })

  it('oneOf titles start with the sentence module title', function () {
    const oneOf = oneOfEntries(schema)
    oneOf.forEach((entry) => {
      const sentence = plugin.sentences[entry.const]!
      assert.ok(
        entry.title.startsWith(sentence.title),
        `${entry.const} title does not start with module title: ${entry.title}`
      )
    })
  })

  it('oneOf titles contain the SK paths from the module', function () {
    const oneOf = oneOfEntries(schema)
    const dbt = oneOf.find((e) => e.const === 'DBT')!
    assert.ok(dbt.title.includes('environment.depth.belowTransducer'))

    const rmc = oneOf.find((e) => e.const === 'RMC')!
    assert.ok(rmc.title.includes('navigation.datetime'))
    assert.ok(rmc.title.includes('navigation.position'))
  })

  it('shows path indicators based on app.getSelfPath', function () {
    // Default stub returns null for all paths; every title should carry
    // the "not present" indicator.
    const oneOf = oneOfEntries(schema)
    const dbt = oneOf.find((e) => e.const === 'DBT')!
    assert.ok(dbt.title.includes('\u274C'), 'expected not-present indicator')
  })

  it('shows present indicator when app.getSelfPath returns data', function () {
    const plug = createPlugin(
      buildStubApp((p) =>
        p === 'environment.depth.belowTransducer' ? { value: 10.5 } : null
      )
    )
    const dbt = oneOfEntries(plug.schema()).find((e) => e.const === 'DBT')!
    assert.ok(dbt.title.includes('\uD83D\uDC4D'), 'expected present indicator')
  })

  it('shows null-value indicator when path exists but value is null', function () {
    const plug = createPlugin(
      buildStubApp((p) =>
        p === 'environment.depth.belowTransducer' ? { value: null } : null
      )
    )
    const dbt = oneOfEntries(plug.schema()).find((e) => e.const === 'DBT')!
    assert.ok(dbt.title.includes('\u274E'), 'expected null-value indicator')
  })

  it('includes a legend in the description', function () {
    const desc = conversionsProp(schema).description!
    assert.ok(desc.includes('\uD83D\uDC4D'), 'legend missing present indicator')
    assert.ok(desc.includes('\u274C'), 'legend missing not-present indicator')
  })

  it('does not contain legacy flat boolean properties', function () {
    const props = schema.properties
    assert.strictEqual(props.RMC, undefined, 'found legacy RMC boolean')
    assert.strictEqual(props.DBT, undefined, 'found legacy DBT boolean')
    assert.strictEqual(
      props.RMC_throttle,
      undefined,
      'found legacy RMC_throttle'
    )
  })
})
