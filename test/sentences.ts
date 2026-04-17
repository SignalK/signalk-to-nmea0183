import * as assert from 'assert'
import type { SentenceEncoder } from '../src/types/plugin'

const stubApp = {
  streambundle: {
    getSelfStream: (): never => {
      throw new Error('streambundle not used in metadata-only tests')
    }
  },
  debug: (): void => {},
  error: (): void => {},
  emit: (): void => {}
}
const load = (name: string): SentenceEncoder =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require(`../src/sentences/${name}`).default(stubApp)

// Invoke an encoder's `f` and assert it did not return undefined. Tests in
// this file only use inputs for which the encoder always produces a
// sentence; this narrows the return type so callers can treat the result
// as `string` without repeated non-null assertions.
function mustEncode(enc: SentenceEncoder, ...args: unknown[]): string {
  const s = enc.f(...args)
  assert.ok(s, 'encoder returned undefined')
  return s as string
}

function expectedChecksum(body: string): string {
  let c = 0
  for (let i = 0; i < body.length; i++) c ^= body.charCodeAt(i)
  return '*' + c.toString(16).toUpperCase().padStart(2, '0')
}

function assertValidSentence(sentence: string): void {
  const m = /^\$([^*]+)\*([0-9A-F]{2})$/.exec(sentence)
  assert.ok(m, `not a well-formed NMEA sentence: ${sentence}`)
  assert.equal(
    '*' + m![2],
    expectedChecksum(m![1]!),
    `bad checksum in ${sentence}`
  )
}

describe('sentence encoders', function () {
  describe('DBK - Depth Below Keel', function () {
    it('encodes at 31.38 m', function () {
      const s = mustEncode(load('DBK'), 31.38)
      assert.ok(s.startsWith('$IIDBK,103.0,f,31.38,M,17.2,F*'))
      assertValidSentence(s)
    })
    it('encodes 0', function () {
      const s = mustEncode(load('DBK'), 0)
      assert.ok(s.startsWith('$IIDBK,0.0,f,0.00,M,0.0,F*'))
      assertValidSentence(s)
    })
  })

  describe('DBS - Depth Below Surface', function () {
    it('encodes at 31.38 m', function () {
      const s = mustEncode(load('DBS'), 31.38)
      assert.ok(s.startsWith('$IIDBS,103.0,f,31.38,M,17.2,F*'))
      assertValidSentence(s)
    })
  })

  describe('DPT (transducer to keel)', function () {
    it('forces the offset to negative regardless of input sign', function () {
      const s = mustEncode(load('DPT'), 10.5, 0.75)
      assert.ok(s.startsWith('$IIDPT,10.50,-0.750*'))
      assertValidSentence(s)
    })
    it('keeps the offset negative when input is already negative', function () {
      const s = mustEncode(load('DPT'), 10.5, -0.75)
      assert.ok(s.startsWith('$IIDPT,10.50,-0.750*'))
    })
  })

  describe('DPT-surface (surface to transducer)', function () {
    it('preserves a positive offset', function () {
      const s = mustEncode(load('DPT-surface'), 9.21, 1.1)
      assert.ok(s.startsWith('$IIDPT,9.21,1.100*'))
      assertValidSentence(s)
    })
    it('preserves a negative offset', function () {
      const s = mustEncode(load('DPT-surface'), 5, -0.2)
      assert.ok(s.startsWith('$IIDPT,5.00,-0.200*'))
    })
  })

  describe('HDT - heading true', function () {
    it('emits heading normalised to [0, 360) with 1 decimal', function () {
      const s = mustEncode(load('HDT'), Math.PI)
      assert.ok(s.startsWith('$IIHDT,180.0,T*'))
      assertValidSentence(s)
    })
    it('wraps negative heading into [0, 360)', function () {
      const s = mustEncode(load('HDT'), -Math.PI / 2)
      assert.ok(s.startsWith('$IIHDT,270.0,T*'))
    })
  })

  describe('HDTC - true heading from magnetic + variation', function () {
    it('sums magnetic and variation', function () {
      const s = mustEncode(load('HDTC'), Math.PI / 2, 0.1)
      assert.ok(s.startsWith('$IIHDT,95.7,T*'))
      assertValidSentence(s)
    })
    it('wraps when sum is negative', function () {
      const s = mustEncode(load('HDTC'), 0.1, -0.3)
      assert.ok(s.startsWith('$IIHDT,348.5,T*'))
    })
  })

  describe('MTW - water temperature (K to C)', function () {
    it('converts K to C with 1 decimal', function () {
      const s = mustEncode(load('MTW'), 293.15)
      assert.ok(s.startsWith('$IIMTW,20.0,C*'))
      assertValidSentence(s)
    })
    it('converts 273.15 K to 0 C', function () {
      const s = mustEncode(load('MTW'), 273.15)
      assert.ok(s.startsWith('$IIMTW,0.0,C*'))
    })
  })

  describe('MTA - air temperature (K to C)', function () {
    it('converts K to C with 2 decimals', function () {
      const s = mustEncode(load('MTA'), 308.0)
      assert.ok(s.startsWith('$IIMTA,34.85,C*'))
      assertValidSentence(s)
    })
  })

  describe('MMB - barometric pressure', function () {
    it('encodes pressure in inHg and bar', function () {
      const s = mustEncode(load('MMB'), 100000)
      assert.ok(s.startsWith('$IIMMB,29.5300,I,1.0000,B*'))
      assertValidSentence(s)
    })
  })

  describe('ROT - rate of turn', function () {
    it('converts rad/s to deg/min', function () {
      const s = mustEncode(load('ROT'), 1)
      assert.ok(s.startsWith('$IIROT,3437.75,A*'))
      assertValidSentence(s)
    })
    it('handles a negative rate', function () {
      const s = mustEncode(load('ROT'), -0.01)
      assert.ok(s.startsWith('$IIROT,-34.38,A*'))
    })
  })

  describe('RSA - rudder sensor angle', function () {
    it('converts the rudder angle from rad to deg', function () {
      const s = mustEncode(load('RSA'), Math.PI / 4)
      assert.ok(s.startsWith('$IIRSA,45.00,A,,*'))
      assertValidSentence(s)
    })
  })

  describe('VLW - total and trip log', function () {
    it('encodes log and trip distances in nautical miles', function () {
      const s = mustEncode(load('VLW'), 1852, 80000)
      assert.ok(s.startsWith('$IIVLW,1.00,N,43.20,N*'))
      assertValidSentence(s)
    })
    it('encodes zero distances', function () {
      const s = mustEncode(load('VLW'), 0, 0)
      assert.ok(s.startsWith('$IIVLW,0.00,N,0.00,N*'))
      assertValidSentence(s)
    })
  })

  describe('VPW - speed parallel to wind', function () {
    it('encodes VMG in knots and m/s', function () {
      const s = mustEncode(load('VPW'), 5)
      assert.ok(s.startsWith('$IIVPW,9.72,N,5.00,M*'))
      assertValidSentence(s)
    })
  })

  describe('VWR - apparent wind angle + speed', function () {
    const enc = load('VWR')
    it('emits R for starboard (positive angle)', function () {
      const s = mustEncode(enc, 1, 0.5)
      assert.ok(s.startsWith('$IIVWR,28.65,R,1.94,N,1.00,M,3.60,K*'))
      assertValidSentence(s)
    })
    it('emits L and abs(angle) for port (negative angle)', function () {
      const s = mustEncode(enc, 1, -0.5)
      assert.ok(s.startsWith('$IIVWR,28.65,L,1.94,N,1.00,M,3.60,K*'))
    })
    it('emits R when angle is exactly 0', function () {
      const s = mustEncode(enc, 5, 0)
      assert.ok(s.startsWith('$IIVWR,0.00,R,'))
    })
  })

  describe('XDR (Barometer)', function () {
    it('emits $IIXDR,P,<bar>,B,Barometer', function () {
      const s = mustEncode(load('XDRBaro'), 102481)
      assert.ok(s.startsWith('$IIXDR,P,1.0248,B,Barometer*'))
      assertValidSentence(s)
    })
  })

  describe('XDR (TempAir)', function () {
    it('emits $IIXDR,C,<celsius>,C,TempAir', function () {
      const s = mustEncode(load('XDRTemp'), 307.95)
      assert.ok(s.startsWith('$IIXDR,C,34.80,C,TempAir*'))
      assertValidSentence(s)
    })
  })

  describe('XDR (PTCH/ROLL)', function () {
    it('emits pitch and roll in degrees', function () {
      const s = mustEncode(load('XDRNA'), { pitch: -0.012, roll: 0.016 })
      assert.ok(s.startsWith('$IIXDR,A,-0.7,D,PTCH,A,0.9,D,ROLL*'))
      assertValidSentence(s)
    })
  })

  describe('XTE - cross-track error (rhumb line)', function () {
    const enc = load('XTE')
    it('emits L when xte is positive (value is absolute)', function () {
      const s = mustEncode(enc, 100)
      assert.ok(s.startsWith('$IIXTE,A,A,0.054,L,N*'))
      assertValidSentence(s)
    })
    it('emits R when xte is negative (value is absolute)', function () {
      const s = mustEncode(enc, -100)
      assert.ok(s.startsWith('$IIXTE,A,A,0.054,R,N*'))
    })
    it('emits L when xte is exactly 0', function () {
      const s = mustEncode(enc, 0)
      assert.ok(s.includes(',0.000,L,'))
    })
  })

  describe('XTE-GC - cross-track error (great circle)', function () {
    const enc = load('XTE-GC')
    it('emits L when xte is positive', function () {
      const s = mustEncode(enc, 100)
      assert.ok(s.startsWith('$IIXTE,A,A,0.054,L,N*'))
      assertValidSentence(s)
    })
    it('emits R when xte is negative', function () {
      const s = mustEncode(enc, -100)
      assert.ok(s.startsWith('$IIXTE,A,A,0.054,R,N*'))
    })
    it('emits L when xte is exactly 0', function () {
      const s = mustEncode(enc, 0)
      assert.ok(s.includes(',0.000,L,'))
    })
  })

  describe('PNKEP01 - target polar speed', function () {
    it('encodes target speed in knots and km/h', function () {
      const s = mustEncode(load('PNKEP01'), 5)
      assert.ok(s.startsWith('$PNKEP,01,9.72,N,18.00,K*'))
      assertValidSentence(s)
    })
  })

  describe('PNKEP02 - COG on other tack', function () {
    it('encodes angle normalised to [0, 360)', function () {
      const s = mustEncode(load('PNKEP02'), Math.PI)
      assert.ok(s.startsWith('$PNKEP,02,180.00*'))
      assertValidSentence(s)
    })
    it('wraps negative angle into [0, 360)', function () {
      const s = mustEncode(load('PNKEP02'), -Math.PI / 2)
      assert.ok(s.startsWith('$PNKEP,02,270.00*'))
    })
  })

  describe('PNKEP03 - polar/VMG/optimum angle', function () {
    it('encodes angle and ratios as percentages', function () {
      const s = mustEncode(load('PNKEP03'), Math.PI / 4, 0.9, 0.85)
      assert.ok(s.startsWith('$PNKEP,03,45.00,90.00,85.00*'))
      assertValidSentence(s)
    })
  })

  describe('PNKEP99 - debug', function () {
    it('emits debug sentence with raw conversions', function () {
      const s = mustEncode(load('PNKEP99'), 0, 0, 0, 0, 0, 0, 0)
      assert.ok(s.startsWith('$PNKEP,99,0,0,0,0,0,0,0*'))
      assertValidSentence(s)
    })
  })

  describe('PSILCD1 - polar speed + target wind angle', function () {
    it('encodes in knots and degrees', function () {
      const s = mustEncode(load('PSILCD1'), 5, Math.PI / 4)
      assert.ok(s.startsWith('$PSILCD1,9.72,45.00*'))
      assertValidSentence(s)
    })
  })

  describe('PSILTBS - target boat speed', function () {
    it('encodes in knots', function () {
      const s = mustEncode(load('PSILTBS'), 5)
      assert.ok(s.startsWith('$PSILTBS,9.72,N*'))
      assertValidSentence(s)
    })
  })
})
