/**
 * Live verification harness: pulls a real snapshot from openplotter.local
 * via REST API and runs it through the BWC encoder. Verifies the output
 * matches what we'd expect for the snapshot values.
 *
 * Run with: npx mocha test/live-openplotter.ts --timeout 10000
 *
 * Skipped automatically if openplotter is unreachable.
 */
import * as assert from 'assert'
import * as https from 'https'
import BWC from '../src/sentences/BWC'

const OPENPLOTTER_HOST = '10.10.10.143'

interface SkValue {
  value: unknown
  $source?: string
  timestamp?: string
}

function fetch(path: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: OPENPLOTTER_HOST,
        port: 443,
        path,
        method: 'GET',
        rejectUnauthorized: false,
        timeout: 5000
      },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          if (res.statusCode === 404) return resolve(null)
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            reject(new Error(`Bad JSON from ${path}: ${data.slice(0, 200)}`))
          }
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.end()
  })
}

async function reachable(): Promise<boolean> {
  try {
    await fetch('/signalk/v1/api/vessels/self/navigation/datetime')
    return true
  } catch {
    return false
  }
}

describe('BWC live verification (openplotter.local)', function () {
  this.timeout(10000)

  let skipReason: string | null = null

  before(async function () {
    if (!(await reachable())) {
      skipReason = `openplotter at ${OPENPLOTTER_HOST} not reachable`
    }
  })

  it('encodes a valid BWC sentence using live snapshot data', async function () {
    if (skipReason) {
      this.skip()
      return
    }

    const [datetime, nextPoint, bearingTrue, bearingMagnetic, distance] =
      (await Promise.all([
        fetch('/signalk/v1/api/vessels/self/navigation/datetime'),
        fetch('/signalk/v1/api/vessels/self/navigation/courseGreatCircle/nextPoint'),
        fetch(
          '/signalk/v1/api/vessels/self/navigation/course/calcValues/bearingTrue'
        ),
        fetch(
          '/signalk/v1/api/vessels/self/navigation/course/calcValues/bearingMagnetic'
        ),
        fetch(
          '/signalk/v1/api/vessels/self/navigation/course/calcValues/distance'
        )
      ])) as [
        SkValue | null,
        Record<string, SkValue> | null,
        SkValue | null,
        SkValue | null,
        SkValue | null
      ]

    // Unwrap REST envelopes; any path may be missing or null when no
    // route is active, in which case skip the test (not a defect).
    const datetimeValue =
      typeof datetime?.value === 'string' ? datetime.value : ''
    const positionValue = (nextPoint?.position as SkValue | undefined)?.value as
      | { latitude: number; longitude: number }
      | null
      | undefined
    const bearingTrueValue =
      typeof bearingTrue?.value === 'number' ? bearingTrue.value : null
    const distanceValue =
      typeof distance?.value === 'number' ? distance.value : null

    if (!positionValue || bearingTrueValue == null || distanceValue == null) {
      console.log('\n[skip] No active route on openplotter — activate one to verify.')
      console.log(`  position:    ${JSON.stringify(positionValue)}`)
      console.log(`  bearingTrue: ${bearingTrueValue}`)
      console.log(`  distance:    ${distanceValue}`)
      this.skip()
      return
    }

    const nextPointValue = {
      position: positionValue,
      name:
        ((nextPoint!.value as SkValue | undefined)?.value as
          | { href?: string | null }
          | undefined)?.href ?? undefined
    }
    const bearingMagneticValue =
      bearingMagnetic && typeof bearingMagnetic.value === 'number'
        ? bearingMagnetic.value
        : undefined

    console.log('\n=== Live openplotter snapshot ===')
    console.log('datetime:        ', datetimeValue)
    console.log('nextPoint:       ', JSON.stringify(nextPointValue))
    console.log('bearingTrue:     ', bearingTrueValue, 'rad')
    console.log('bearingMagnetic: ', bearingMagneticValue, 'rad')
    console.log('distance:        ', distanceValue, 'm')

    const stubApp = {
      emit: () => {},
      debug: (msg: string) => console.log('  [debug]', msg),
      streambundle: { getSelfStream: () => ({ toProperty: () => ({}) }) }
    } as unknown as Parameters<typeof BWC>[0]

    const encoder = BWC(stubApp)
    const sentence = encoder.f(
      datetimeValue,
      nextPointValue,
      bearingTrueValue,
      bearingMagneticValue,
      distanceValue
    )

    console.log('\n=== Emitted BWC sentence ===')
    console.log(sentence)
    console.log('')

    assert.ok(sentence, 'encoder must produce a sentence from live data')
    assert.match(sentence!, /^\$IIBWC,\d{6}\.\d{2},/, 'starts with talker + UTC time')
    assert.match(sentence!, /\*[0-9A-F]{2}$/, 'has valid checksum suffix')

    const [body, checksum] = sentence!.split('*')
    let computed = 0
    for (let i = 1; i < body!.length; i++) {
      computed ^= body!.charCodeAt(i)
    }
    const expected = ('0' + computed.toString(16).toUpperCase()).slice(-2)
    assert.equal(checksum, expected, 'XOR checksum is correct')

    const fields = body!.split(',')
    assert.equal(fields.length, 13, 'sentence has 13 fields')
    assert.equal(fields[0], '$IIBWC')
    assert.equal(fields[7], 'T', 'true bearing indicator')
    assert.equal(fields[11], 'N', 'distance unit indicator')

    // Cross-check bearing values against the radian inputs.
    const expectedTrueDeg = ((bearingTrueValue * 180) / Math.PI + 360) % 360
    assert.equal(
      fields[6],
      expectedTrueDeg.toFixed(1),
      `field 6 (true bearing) matches ${expectedTrueDeg.toFixed(1)}°`
    )
    if (bearingMagneticValue !== undefined) {
      const expectedMagDeg =
        ((bearingMagneticValue * 180) / Math.PI + 360) % 360
      assert.equal(
        fields[8],
        expectedMagDeg.toFixed(1),
        `field 8 (magnetic bearing) matches ${expectedMagDeg.toFixed(1)}°`
      )
      assert.equal(fields[9], 'M')
    } else {
      assert.equal(fields[8], '', 'field 8 empty when magnetic missing')
      assert.equal(fields[9], '', 'field 9 empty when magnetic missing')
    }

    // Distance check (m -> NM).
    const expectedDist = (distanceValue * 0.000539957).toFixed(2)
    assert.equal(fields[10], expectedDist, `distance ${expectedDist} NM`)

    // Position formatting.
    const lat = nextPointValue.position!.latitude
    const lon = nextPointValue.position!.longitude
    assert.equal(fields[3], lat >= 0 ? 'N' : 'S')
    assert.equal(fields[5], lon >= 0 ? 'E' : 'W')

    console.log('=== All assertions passed ===\n')
  })
})
