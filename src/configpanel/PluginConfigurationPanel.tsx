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

interface Configuration {
  conversions?: Conversion[]
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

// Path-status values mirror the schema indicators:
//   'ok'      -> path has data         (\uD83D\uDC4D)
//   'null'    -> path exists, null     (\u274E)
//   'missing' -> path absent from tree (\u274C)
type PathStatus = 'ok' | 'null' | 'missing'

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
    background: 'transparent',
    border: 'none',
    color: '#dc3545',
    cursor: 'pointer',
    fontSize: 18,
    padding: '2px 8px',
    lineHeight: 1,
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0
  },
  dotOk: { background: '#28a745' },
  dotNull: { background: '#ffc107' },
  dotMissing: { background: '#dc3545' },
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
          setSentences(
            oneOf.map((o) => ({
              key: o.const,
              title: o.title.replace(/\s*\[.*\]$/, ''),
              paths: parsePaths(o)
            }))
          )
        }
        setPathStatus(flattenVessel(vessel))
      })
      .catch(() => {})
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

  const dotStyleFor = (p: string): CSSProperties => {
    const s = pathStatus[p]
    return {
      ...S.dot,
      ...(s === 'ok' ? S.dotOk : s === 'null' ? S.dotNull : S.dotMissing)
    }
  }

  return (
    <div style={S.root}>
      <div style={S.desc}>
        Select which NMEA 0183 sentences to generate from Signal K data. A
        sentence will only emit when all its required paths have data.
      </div>

      <div style={S.legend}>
        <span style={S.legendItem}>
          <span style={{ ...S.dot, ...S.dotOk }} /> has data
        </span>
        <span style={S.legendItem}>
          <span style={{ ...S.dot, ...S.dotNull }} /> value is null
        </span>
        <span style={S.legendItem}>
          <span style={{ ...S.dot, ...S.dotMissing }} /> not present
        </span>
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
                  title="Remove"
                  aria-label="Remove conversion"
                >
                  {'\u2715'}
                </button>
              </div>

              {info && info.paths.length > 0 && (
                <div style={S.pathBox}>
                  <div style={S.pathLabel}>Required Signal K paths</div>
                  <ul style={S.pathList}>
                    {info.paths.map((p) => (
                      <li key={p} style={S.pathItem}>
                        <span style={dotStyleFor(p)} />
                        {p}
                      </li>
                    ))}
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
// Helpers
// ---------------------------------------------------------------------------

function parsePaths(oneOfEntry: OneOfEntry): string[] {
  const match = /\[(.+)\]$/.exec(oneOfEntry.title)
  if (!match) return []
  return match[1]!.split(', ').map((p) => p.replace(/\([^)]*\)$/, ''))
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
