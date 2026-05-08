import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

type AnyApp = ReturnType<typeof createAppWithPlugin>

interface NextPointArg {
  name?: string
  position?: { latitude: number; longitude: number }
}

interface BwcOverrides {
  datetime?: string
  nextPoint?: NextPointArg | null
  bearingTrue?: number | undefined
  bearingMagnetic?: number | undefined | null
  distance?: number | undefined
}

describe('BWC', function () {
  // Real navigation data: vessel approaching waypoint near Marsh Harbour, Bahamas
  // (sampled from live signalk-server). Datetime UTC, position from
  // navigation.courseGreatCircle.nextPoint.position, bearings/distance from
  // navigation.course.calcValues.*.
  const realDatetime = '2026-05-08T16:09:11Z'
  const realNextPoint: NextPointArg = {
    position: { latitude: 26.548128458856745, longitude: -77.05918908119203 }
  }
  const realBearingTrue = 4.823539078855837 // 276.367°
  const realBearingMagnetic = 4.662719865445489 // 267.155°
  const realDistance = 361.05917210538576 // 0.195 NM

  function pushBwcStreams(app: AnyApp, overrides: BwcOverrides): void {
    app.streambundle
      .getSelfStream('navigation.datetime')
      .push(overrides.datetime ?? realDatetime)
    app.streambundle
      .getSelfStream('navigation.courseGreatCircle.nextPoint')
      .push('nextPoint' in overrides ? overrides.nextPoint : realNextPoint)
    app.streambundle
      .getSelfStream('navigation.course.calcValues.bearingTrue')
      .push('bearingTrue' in overrides ? overrides.bearingTrue : realBearingTrue)
    // bearingMagnetic is optional. Push undefined to exercise the
    // "magnetic unknown" branch; push a number to provide a value.
    if ('bearingMagnetic' in overrides) {
      app.streambundle
        .getSelfStream('navigation.course.calcValues.bearingMagnetic')
        .push(overrides.bearingMagnetic)
    } else {
      app.streambundle
        .getSelfStream('navigation.course.calcValues.bearingMagnetic')
        .push(realBearingMagnetic)
    }
    app.streambundle
      .getSelfStream('navigation.course.calcValues.distance')
      .push('distance' in overrides ? overrides.distance : realDistance)
  }

  // The toNmeaDegrees* helpers embed a comma (e.g. "4807.0380,N"), so the
  // final sentence has more comma-separated fields than array elements.
  function parseBwc(sentence: string): {
    fields: Record<string, string | undefined>
    body: string
    checksum: string
  } {
    const [body, checksum] = sentence.split('*')
    const parts = body!.split(',')
    return {
      fields: {
        talker: parts[0],
        time: parts[1],
        latitude: parts[2] + ',' + parts[3],
        longitude: parts[4] + ',' + parts[5],
        bearingTrue: parts[6],
        bearingTrueIndicator: parts[7],
        bearingMagnetic: parts[8],
        bearingMagneticIndicator: parts[9],
        distance: parts[10],
        distanceUnit: parts[11],
        waypointId: parts[12]
      },
      body: body!,
      checksum: checksum!
    }
  }

  it('emits a valid BWC sentence with real openplotter navigation data', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const { fields } = parseBwc(value as string)
      assert.equal(fields.talker, '$IIBWC')
      assert.equal(fields.time, '160911.00')
      // 26.548128 -> 26 deg, 32.8877 min
      assert.equal(fields.latitude, '2632.8877,N')
      // -77.05918908 -> 077 deg, 03.5513 min, W
      assert.equal(fields.longitude, '07703.5513,W')
      assert.equal(fields.bearingTrueIndicator, 'T')
      assert.equal(fields.bearingMagneticIndicator, 'M')
      assert.equal(fields.distanceUnit, 'N')
      assert.equal(fields.bearingTrue, '276.4')
      assert.equal(fields.bearingMagnetic, '267.2')
      assert.equal(fields.distance, '0.19')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {})
  })

  it('uses pre-computed bearingMagnetic from the server', (done) => {
    // The server provides bearingTrue and bearingMagnetic separately;
    // encoder must NOT recompute magnetic from variation.
    const onEmit = (_event: string, value: unknown): void => {
      const { fields } = parseBwc(value as string)
      assert.equal(fields.bearingTrue, '276.4')
      assert.equal(fields.bearingMagnetic, '267.2')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {})
  })

  it('emits empty fields 8 and 9 when bearingMagnetic is undefined', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const { fields } = parseBwc(value as string)
      assert.equal(
        fields.bearingMagnetic,
        '',
        'field 8 must be empty when magnetic is unknown'
      )
      assert.equal(
        fields.bearingMagneticIndicator,
        '',
        'field 9 must be empty when field 8 is empty'
      )
      // True bearing must still be present
      assert.equal(fields.bearingTrue, '276.4')
      assert.equal(fields.bearingTrueIndicator, 'T')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, { bearingMagnetic: undefined })
  })

  it('uses waypoint name in field 12 when available', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const { fields } = parseBwc(value as string)
      assert.equal(fields.waypointId, 'BAHAMAS_WP1')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {
      nextPoint: {
        position: { latitude: 26.548128458856745, longitude: -77.05918908119203 },
        name: 'BAHAMAS_WP1'
      }
    })
  })

  it('uses empty field 12 when waypoint has no name', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const { fields } = parseBwc(value as string)
      assert.equal(fields.waypointId, '')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {})
  })

  it('truncates waypoint name longer than 20 characters', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const { fields } = parseBwc(value as string)
      assert.equal(fields.waypointId!.length, 20)
      assert.equal(fields.waypointId, 'AAAAAAAAAAAAAAAAAAAA')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {
      nextPoint: {
        position: { latitude: 26.548128, longitude: -77.05918 },
        name: 'A'.repeat(25)
      }
    })
  })

  it('strips NMEA reserved characters from waypoint name', (done) => {
    // A name containing , * $ \r \n could inject fields, forge a checksum
    // boundary, or terminate the sentence. The encoder must strip them.
    const onEmit = (_event: string, value: unknown): void => {
      const { fields, body } = parseBwc(value as string)
      assert.equal(fields.waypointId, 'BADWPNAME')
      // Sentence must split cleanly into 13 fields, not get extra ones from
      // the injected commas.
      assert.equal(body.split(',').length, 13)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {
      nextPoint: {
        position: { latitude: 26.548128, longitude: -77.05918 },
        name: 'BAD,WP*$NA\rM\nE'
      }
    })
  })

  it('does not emit when nextPoint has no position', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {
      nextPoint: { name: 'NOPOS' }
    })
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })

  it('does not emit when nextPoint is null', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, { nextPoint: null })
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })

  it('does not emit when bearingTrue is undefined', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, { bearingTrue: undefined })
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })

  it('does not emit when distance is undefined', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, { distance: undefined })
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })

  it('does not emit on NaN bearingTrue', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, { bearingTrue: NaN })
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })

  it('does not emit on Infinity distance', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, { distance: Infinity })
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })

  it('does not emit on negative distance', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, { distance: -10 })
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })

  it('does not emit on out-of-range latitude', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {
      nextPoint: { position: { latitude: 91, longitude: 0 } }
    })
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })

  it('does not emit on out-of-range longitude', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {
      nextPoint: { position: { latitude: 0, longitude: 200 } }
    })
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })

  it('does not emit when datetime is empty string', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, { datetime: '' })
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })

  it('does not emit when datetime is unparseable', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, { datetime: 'not-a-date' })
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })

  it('handles timezone-offset datetime by converting to UTC', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const { fields } = parseBwc(value as string)
      // 18:09:11 +02:00 -> 16:09:11 UTC
      assert.equal(fields.time, '160911.00')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, { datetime: '2026-05-08T18:09:11+02:00' })
  })

  it('emits a valid checksum', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const sentence = value as string
      const [body, checksumStr] = sentence.split('*')
      let computed = 0
      for (let i = 1; i < body!.length; i++) {
        computed ^= body!.charCodeAt(i)
      }
      const expected = ('0' + computed.toString(16).toUpperCase()).slice(-2)
      assert.equal(checksumStr, expected, 'XOR checksum must match')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {})
  })

  it('subscribes to all five required Signal K paths', () => {
    const stubApp = {
      streambundle: {
        getSelfStream: (): unknown => ({ toProperty: () => ({}) })
      },
      emit: (): void => {},
      debug: (): void => {}
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bwc = require('../src/sentences/BWC').default(stubApp)
    assert.deepStrictEqual(bwc.keys, [
      'navigation.datetime',
      'navigation.courseGreatCircle.nextPoint',
      'navigation.course.calcValues.bearingTrue',
      'navigation.course.calcValues.bearingMagnetic',
      'navigation.course.calcValues.distance'
    ])
  })
})
