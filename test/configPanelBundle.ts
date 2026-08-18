/**
 * Guards the React contract of the Module Federation bundle in `public/`.
 *
 * The admin UI renders the configuration panel inside its own React tree
 * and hands the container its share scope. Signal K has shipped React 16
 * and React 19 admin UIs across the server versions still in the field,
 * so the panel has to run on whichever React the host provides. Any copy
 * of React that ends up inside this bundle breaks that: elements built by
 * one React major are not recognised by another's reconciler, and hooks
 * dispatch into a runtime the host never activated. Either way the panel
 * throws on first render and the admin UI's error boundary replaces the
 * whole configuration view.
 *
 * These assertions run against the built artifacts, so they need
 * `npm run build:config` to have run first (CI does this before the
 * suite).
 */
import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'

const PUBLIC_DIR = path.join(__dirname, '..', 'public')

/** Every emitted JS asset, as `{ name, source }`. */
function readBundle(): Array<{ name: string; source: string }> {
  assert.ok(
    fs.existsSync(PUBLIC_DIR),
    `${PUBLIC_DIR} is missing - run "npm run build:config" before the tests`
  )
  const files = fs
    .readdirSync(PUBLIC_DIR)
    .filter((name) => name.endsWith('.js'))
  assert.ok(files.length > 0, 'no JS assets in public/')
  return files.map((name) => ({
    name,
    source: fs.readFileSync(path.join(PUBLIC_DIR, name), 'utf8')
  }))
}

describe('configuration panel bundle', function () {
  it('bundles no React implementation of its own', () => {
    // React tags every element it creates with a well-known symbol, and
    // the name changed between majors ("react.element" through React 18,
    // "react.transitional.element" in React 19). Finding either string
    // means a React core or jsx-runtime was bundled rather than shared.
    const offenders = readBundle()
      .filter(
        ({ source }) =>
          source.includes('react.transitional.element') ||
          source.includes('react.element')
      )
      .map(({ name }) => name)
    assert.deepEqual(
      offenders,
      [],
      `React element factory bundled into ${offenders.join(', ')}; ` +
        'the panel must consume React from the host share scope'
    )
  })

  it('compiles the panel through React.createElement', () => {
    // `react/jsx-runtime` is a separate entry point that Module
    // Federation does not share, so the automatic JSX transform always
    // bundles the plugin's own copy of it. `"jsx": "react"` in
    // tsconfig.json keeps JSX on `React.createElement`, which resolves
    // through the shared `react` module instead.
    //
    // Look only at the chunk holding the panel: webpack's own script
    // loader calls `document.createElement`, so the runtime chunks say
    // nothing about which JSX transform was used.
    const panelChunk = readBundle().find(({ source }) =>
      source.includes('No conversions configured')
    )
    assert.ok(panelChunk, 'no chunk contains the panel component')
    const calls = panelChunk.source.match(/createElement/g) ?? []
    assert.ok(
      calls.length > 10,
      `panel chunk has ${calls.length} createElement calls; ` +
        'expected the classic JSX runtime'
    )
  })

  it('offers no React version to the host share scope', () => {
    // Webpack's singleton resolution picks the highest registered
    // version unless the host's entry is already loaded. Registering a
    // version here is what lets the panel win against an older host and
    // load a second React. `import: false` in webpack.config.js keeps
    // the container out of the register call entirely.
    //
    // Registration looks like: ("react","19.2.8")
    const remoteEntry = readBundle().find(
      ({ name }) => name === 'remoteEntry.js'
    )
    assert.ok(remoteEntry, 'remoteEntry.js missing from public/')
    const registrations = remoteEntry.source.match(/\("react","[0-9][^"]*"/g)
    assert.equal(
      registrations,
      null,
      `remoteEntry.js registers React ${String(registrations)} in the share scope`
    )
  })

  it('exposes the panel under the name the admin UI asks for', () => {
    const remoteEntry = readBundle().find(
      ({ name }) => name === 'remoteEntry.js'
    )!
    assert.ok(
      remoteEntry.source.includes('./PluginConfigurationPanel'),
      'container must expose ./PluginConfigurationPanel'
    )
  })
})
