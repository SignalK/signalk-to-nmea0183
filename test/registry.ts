/**
 * Contract test: every `src/sentences/<NAME>.ts` file must be imported
 * by the static barrel (`src/sentences/index.ts`). Before 2.x the
 * plugin discovered encoders by scanning the directory at startup;
 * the static registry replaced that, and this test ensures a new
 * encoder that someone forgets to add to the barrel is caught in CI
 * rather than silently dropped from the plugin in production.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as assert from 'assert'
import { sentenceFactories } from '../src/sentences'

const sentencesDir = path.resolve(__dirname, '..', 'src', 'sentences')

describe('sentences registry', function () {
  it('imports every encoder file under src/sentences/', function () {
    const onDisk = fs
      .readdirSync(sentencesDir)
      .filter(
        (f) => f.endsWith('.ts') && !f.endsWith('.d.ts') && f !== 'index.ts'
      )
      .map((f) => f.replace(/\.ts$/, ''))
      .sort()

    const registered = Object.keys(sentenceFactories).sort()

    assert.deepStrictEqual(
      registered,
      onDisk,
      'The static barrel in src/sentences/index.ts must list every ' +
        'encoder file. If you added a new file, add it to the barrel. ' +
        'If you removed a file, remove it from the barrel.'
    )
  })

  it('has at least the baseline set (regression safety net)', function () {
    // Sanity floor: ensures the parity test isn't trivially satisfied
    // by an empty directory + empty barrel.
    assert.ok(
      Object.keys(sentenceFactories).length >= 40,
      `Expected >= 40 sentence encoders; got ${Object.keys(sentenceFactories).length}`
    )
  })
})
