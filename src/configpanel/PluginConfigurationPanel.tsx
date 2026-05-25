import React, { useState, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Conversion {
  sentence: string
  throttle?: number
  event?: string
}

// Configuration is loose because pre-1.17 setups still ship the
// legacy flat-boolean shape (`{ DBT: true, DBT_throttle: 500 }`).
// The unknown index signature lets the migration in `migrateConversions`
// reach into those keys without `as` casts in the call site.
interface Configuration {
  conversions?: Conversion[]
  [legacyKey: string]: unknown
}

interface Props {
  configuration?: Configuration
  save: (cfg: Configuration) => void
}

interface OneOfEntry {
  const: string
  title: string
}

interface SchemaWithConversions {
  properties: {
    conversions: {
      items: {
        properties: {
          sentence: {
            oneOf?: OneOfEntry[]
          }
        }
      }
    }
  }
}

interface PluginMeta {
  id: string
  schema: SchemaWithConversions | (() => SchemaWithConversions)
}

interface SentenceInfo {
  key: string
  title: string
  paths: string[]
}

// Path-status values mirror the README's icon legend so the UI and the
// docs use exactly the same vocabulary:
//   'ok'      -> path has data         (✅ White Heavy Check Mark)
//   'null'    -> path exists, null     (❓ Black Question Mark Ornament)
//   'missing' -> path absent from tree (❌ Cross Mark)
type PathStatus = 'ok' | 'null' | 'missing'

const STATUS_ICON: Record<PathStatus, string> = {
  ok: '✅',
  null: '❓',
  missing: '❌'
}

const STATUS_LABEL: Record<PathStatus, string> = {
  ok: 'has data',
  null: 'value is null',
  missing: 'not present'
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const S: Record<string, CSSProperties> = {
  root: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#333',
    padding: '16px 0'
  },
  desc: { fontSize: 13, color: '#666', marginBottom: 12 },
  legend: {
    fontSize: 12,
    color: '#888',
    marginBottom: 14,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 14,
    alignItems: 'center'
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: 4 },
  empty: {
    textAlign: 'center',
    padding: '24px 16px',
    color: '#999',
    fontSize: 13,
    border: '1px dashed #ddd',
    borderRadius: 8
  },
  card: {
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    background: '#fff'
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  select: {
    flex: 1,
    minWidth: 0,
    padding: '6px 10px',
    borderRadius: 4,
    border: '1px solid #ccc',
    fontSize: 13,
    background: '#fff'
  },
  removeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    padding: 0,
    background: '#fff',
    border: '1.5px solid #ef6b6b',
    borderRadius: 8,
    color: '#ef6b6b',
    cursor: 'pointer',
    flexShrink: 0
  },
  pathBox: {
    background: '#f8f9fa',
    borderRadius: 4,
    padding: '6px 10px',
    marginBottom: 10
  },
  pathLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 4,
    fontWeight: 600
  },
  pathList: { margin: 0, padding: 0, listStyle: 'none' },
  pathItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '1px 0',
    fontSize: 11,
    fontFamily: 'SFMono-Regular, Consolas, monospace',
    wordBreak: 'break-all'
  },
  statusIcon: {
    fontSize: 12,
    flexShrink: 0,
    lineHeight: 1
  },
  fields: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10
  },
  field: { flex: '1 1 140px', minWidth: 120 },
  fieldLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 3,
    display: 'block',
    fontWeight: 600
  },
  input: {
    width: '100%',
    padding: '6px 10px',
    borderRadius: 4,
    border: '1px solid #ccc',
    fontSize: 13,
    boxSizing: 'border-box'
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    border: 'none',
    borderRadius: 5,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer'
  },
  btnAdd: { background: '#17a2b8', color: '#fff' },
  btnSave: { background: '#28a745', color: '#fff' },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
    marginTop: 14
  },
  status: { fontSize: 12, minHeight: 18 }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PluginConfigurationPanel({
  configuration,
  save
}: Props): React.ReactElement {
  const cfg = configuration ?? {}
  const [conversions, setConversions] = useState<Conversion[]>(
    () => cfg.conversions ?? []
  )
  const [sentences, setSentences] = useState<SentenceInfo[]>([])
  const [pathStatus, setPathStatus] = useState<Record<string, PathStatus>>({})
  const [status, setStatus] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/skServer/plugins').then((r) => r.json() as Promise<PluginMeta[]>),
      fetch('/signalk/v1/api/vessels/self').then((r) => r.json())
    ])
      .then(([plugins, vessel]) => {
        const p = plugins.find((pl) => pl.id === 'sk-to-nmea0183')
        if (p) {
          const schema = typeof p.schema === 'function' ? p.schema() : p.schema
          const oneOf =
            schema.properties.conversions.items.properties.sentence.oneOf ?? []
          const loadedSentences: SentenceInfo[] = oneOf.map((o) => ({
            key: o.const,
            title: o.title.replace(/\s*\[.*\]$/, ''),
            paths: parsePaths(o)
          }))
          setSentences(loadedSentences)
          // Mirror `resolveConversions` in src/index.ts: if the saved
          // config is in the pre-1.17 flat-boolean shape, lift those
          // keys into the array form so the UI shows the user's old
          // selections instead of an empty list. The user still has to
          // click Save to persist the migrated shape to disk.
          if (!cfg.conversions) {
            const migrated = migrateLegacyConversions(cfg, loadedSentences)
            if (migrated.length > 0) {
              // Guard against clobbering in-progress edits: only seed
              // the list if it is still empty when the fetch resolves.
              setConversions((current) =>
                current.length === 0 ? migrated : current
              )
            }
          }
        }
        setPathStatus(flattenVessel(vessel))
      })
      .catch(() => {})
    // `cfg` comes from props; we only want this to run on mount so a
    // re-render with a different `configuration` reference does not
    // overwrite in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      fetch('/signalk/v1/api/vessels/self')
        .then((r) => r.json())
        .then((vessel) => setPathStatus(flattenVessel(vessel)))
        .catch(() => {})
    }, 10000)
    return () => clearInterval(id)
  }, [])

  const doSave = useCallback(() => {
    const clean = conversions.filter((c) => c.sentence)
    save({ conversions: clean })
    setConversions(clean)
    setStatus('Saved!')
    setTimeout(() => setStatus(''), 3000)
  }, [conversions, save])

  const addRow = (): void =>
    setConversions([...conversions, { sentence: '', throttle: 0 }])
  const removeRow = (i: number): void =>
    setConversions(conversions.filter((_, j) => j !== i))
  const updateRow = <K extends keyof Conversion>(
    i: number,
    field: K,
    value: Conversion[K]
  ): void =>
    setConversions(
      conversions.map((c, j) => (j === i ? { ...c, [field]: value } : c))
    )
  const getSentenceInfo = (key: string): SentenceInfo | undefined =>
    sentences.find((s) => s.key === key)

  // Default missing entries to 'missing' so the icon stays meaningful before
  // the first vessel fetch resolves and for paths the tree never carries.
  const statusFor = (p: string): PathStatus => pathStatus[p] ?? 'missing'

  return (
    <div style={S.root}>
      <div style={S.desc}>
        Select which NMEA 0183 sentences to generate from Signal K data. A
        sentence will only emit when all its required paths have data.
      </div>

      <div style={S.legend}>
        {(['ok', 'null', 'missing'] as const).map((s) => (
          <span key={s} style={S.legendItem}>
            <span style={S.statusIcon} aria-hidden="true">
              {STATUS_ICON[s]}
            </span>{' '}
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>

      {conversions.length === 0 ? (
        <div style={S.empty}>
          No conversions configured. Click &ldquo;Add conversion&rdquo; to get
          started.
        </div>
      ) : (
        conversions.map((conv, i) => {
          const info = getSentenceInfo(conv.sentence)
          return (
            <div key={i} style={S.card}>
              <div style={S.cardTop}>
                <select
                  style={S.select}
                  value={conv.sentence}
                  onChange={(e) => updateRow(i, 'sentence', e.target.value)}
                >
                  <option value="">-- select sentence --</option>
                  {sentences.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.title}
                    </option>
                  ))}
                </select>
                <button
                  style={S.removeBtn}
                  onClick={() => removeRow(i)}
                  title="Remove conversion"
                  aria-label="Remove conversion"
                >
                  <TrashIcon />
                </button>
              </div>

              {info && info.paths.length > 0 && (
                <div style={S.pathBox}>
                  <div style={S.pathLabel}>Required Signal K paths</div>
                  <ul style={S.pathList}>
                    {info.paths.map((p) => {
                      const s = statusFor(p)
                      return (
                        <li key={p} style={S.pathItem}>
                          <span style={S.statusIcon} title={STATUS_LABEL[s]}>
                            {STATUS_ICON[s]}
                          </span>
                          {p}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              <div style={S.fields}>
                <div style={S.field}>
                  <label style={S.fieldLabel}>Minimum interval (ms)</label>
                  <input
                    style={S.input}
                    type="number"
                    value={conv.throttle ?? 0}
                    onChange={(e) =>
                      updateRow(
                        i,
                        'throttle',
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    placeholder="0 = no throttling"
                  />
                </div>
                <div style={S.field}>
                  <label style={S.fieldLabel}>Custom event name</label>
                  <input
                    style={S.input}
                    type="text"
                    value={conv.event ?? ''}
                    onChange={(e) => updateRow(i, 'event', e.target.value)}
                    placeholder="optional"
                  />
                </div>
              </div>
            </div>
          )
        })
      )}

      <div style={S.actions}>
        <button style={{ ...S.btn, ...S.btnAdd }} onClick={addRow}>
          + Add conversion
        </button>
        <button style={{ ...S.btn, ...S.btnSave }} onClick={doSave}>
          Save Configuration
        </button>
        {status && (
          <span style={{ ...S.status, color: '#28a745' }}>{status}</span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

// Inline trashcan glyph. Kept inline (rather than emoji or a font dep) so the
// button can be styled to read as a button rather than as decoration: the
// stroke picks up `currentColor` from the surrounding button.
function TrashIcon(): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parsePaths(oneOfEntry: OneOfEntry): string[] {
  const match = /\[(.+)\]$/.exec(oneOfEntry.title)
  if (!match) return []
  return match[1]!.split(', ').map((p) => p.replace(/\([^)]*\)$/, ''))
}

// Lift a legacy flat-boolean options object into the array shape so
// pre-1.17 users see their existing selections after upgrading.
// Mirrors the runtime migration in `resolveConversions` (src/index.ts);
// kept in lockstep with it so the UI and the plugin agree on which
// sentences were active.
//
// Input:  { DBT: true, DBT_throttle: 500, foo: 'bar' }
// Output: [{ sentence: 'DBT', throttle: 500 }]
function migrateLegacyConversions(
  cfg: Configuration,
  sentences: SentenceInfo[]
): Conversion[] {
  const out: Conversion[] = []
  for (const s of sentences) {
    if (cfg[s.key]) {
      const throttleRaw = cfg[`${s.key}_throttle`]
      const throttle = typeof throttleRaw === 'number' ? throttleRaw : 0
      out.push({ sentence: s.key, throttle })
    }
  }
  return out
}

// Vessel tree → flat `{ 'a.b.c': 'ok' | 'null' | 'missing' }` lookup.
// A node is considered a leaf the moment it carries a `value` key; any
// deeper nesting below such a node is ignored. This mirrors how the SK
// REST API exposes value objects and keeps the lookup O(tree-size).
function flattenVessel(
  obj: unknown,
  prefix?: string
): Record<string, PathStatus> {
  const result: Record<string, PathStatus> = {}
  if (!obj || typeof obj !== 'object') return result
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    const fullPath = prefix ? `${prefix}.${key}` : key
    const val = (obj as Record<string, unknown>)[key]
    if (val && typeof val === 'object' && 'value' in val) {
      const v = (val as { value: unknown }).value
      result[fullPath] = v === null ? 'null' : 'ok'
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenVessel(val, fullPath))
    }
  }
  return result
}
