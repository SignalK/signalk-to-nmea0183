import * as assert from 'assert'
import type { SentenceEncoder } from '../src/types/plugin'

const stubApp = {}
const load = (name: string): SentenceEncoder =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require(`../src/sentences/${name}`).default(stubApp)

interface Expectation {
  name: string
  sentence?: string
  title: string
  keys: string[]
}

const expectations: Expectation[] = [
  {
    name: 'APB',
    sentence: 'APB',
    title: 'APB - Autopilot info (magnetic bearings)',
    keys: [
      'navigation.course.calcValues.crossTrackError',
      'navigation.course.calcValues.bearingTrackTrue',
      'navigation.course.calcValues.bearingTrue',
      'navigation.course.nextPoint',
      'navigation.magneticVariation'
    ]
  },
  {
    name: 'APB-true',
    sentence: 'APB',
    title: 'APB - Autopilot info (true bearings)',
    keys: [
      'navigation.course.calcValues.crossTrackError',
      'navigation.course.calcValues.bearingTrackTrue',
      'navigation.course.calcValues.bearingTrue',
      'navigation.course.nextPoint'
    ]
  },
  {
    name: 'DBK',
    sentence: 'DBK',
    title: 'DBK - Depth Below Keel',
    keys: ['environment.depth.belowKeel']
  },
  {
    name: 'DBS',
    sentence: 'DBS',
    title: 'DBS - Depth Below Surface',
    keys: ['environment.depth.belowSurface']
  },
  {
    name: 'DBT',
    sentence: 'DBT',
    title: 'DBT - Depth Below Transducer',
    keys: ['environment.depth.belowTransducer']
  },
  {
    name: 'DPT-surface',
    sentence: 'DPT',
    title: 'DPT - Depth at Surface (using surfaceToTransducer)',
    keys: [
      'environment.depth.belowTransducer',
      'environment.depth.surfaceToTransducer'
    ]
  },
  {
    name: 'DPT',
    sentence: 'DPT',
    title: 'DPT - Depth',
    keys: [
      'environment.depth.belowTransducer',
      'environment.depth.transducerToKeel'
    ]
  },
  {
    name: 'GGA',
    sentence: 'GGA',
    title: 'GGA - Time, position, and fix related data',
    keys: [
      'navigation.datetime',
      'navigation.position',
      'navigation.gnss.methodQuality',
      'navigation.gnss.satellites',
      'navigation.gnss.horizontalDilution',
      'navigation.gnss.antennaAltitude',
      'navigation.gnss.geoidalSeparation',
      'navigation.gnss.differentialAge',
      'navigation.gnss.differentialReference'
    ]
  },
  {
    name: 'GLL',
    sentence: 'GLL',
    title: 'GLL - Geographical position, latitude and longitude',
    keys: ['navigation.datetime', 'navigation.position']
  },
  {
    name: 'HDG',
    sentence: 'HDG',
    title: 'HDG - Heading, Deviation & Variation',
    keys: ['navigation.headingMagnetic', 'navigation.magneticVariation']
  },
  {
    name: 'HDM',
    sentence: 'HDM',
    title: 'HDM - Heading Magnetic',
    keys: ['navigation.headingMagnetic']
  },
  {
    name: 'HDMC',
    sentence: 'HDM',
    title: 'HDM - Heading Magnetic, calculated from True',
    keys: ['navigation.headingTrue', 'navigation.magneticVariation']
  },
  {
    name: 'HDT',
    sentence: 'HDT',
    title: 'HDT - Heading True',
    keys: ['navigation.headingTrue']
  },
  {
    name: 'HDTC',
    sentence: 'HDTC',
    title: 'HDT - Heading True calculated from magnetic heading and variation',
    keys: ['navigation.headingMagnetic', 'navigation.magneticVariation']
  },
  {
    name: 'MMB',
    sentence: 'MMB',
    title: 'MMB - Environment outside pressure',
    keys: ['environment.outside.pressure']
  },
  {
    name: 'MTA',
    sentence: 'MTA',
    title: 'MTA - Air temperature.',
    keys: ['environment.outside.temperature']
  },
  {
    name: 'MTW',
    sentence: 'MTW',
    title: 'MTW - Water Temperature',
    keys: ['environment.water.temperature']
  },
  {
    name: 'MWD',
    sentence: 'MWD',
    title: 'MWD - Wind relative to North, speed might be ground speed.',
    keys: [
      'environment.wind.directionTrue',
      'navigation.magneticVariation',
      'environment.wind.speedTrue'
    ]
  },
  {
    name: 'MWVR',
    sentence: 'MWV',
    title: 'MWV - Apparent Wind heading and speed',
    keys: ['environment.wind.angleApparent', 'environment.wind.speedApparent']
  },
  {
    name: 'MWVT',
    sentence: 'MWV',
    title: 'MWV - True Wind heading and speed',
    keys: ['environment.wind.angleTrueWater', 'environment.wind.speedTrue']
  },
  {
    name: 'PNKEP01',
    title: 'PNKEP,01 - Target Polar speed',
    keys: ['performance.polarSpeed']
  },
  {
    name: 'PNKEP02',
    title: 'PNKEP,02 - Course (COG) on other tack from 0 to 359°',
    keys: ['performance.tackMagnetic']
  },
  {
    name: 'PNKEP03',
    title: 'PNKEP,03 - Polar and VMG, and optimum angle.',
    keys: [
      'performance.targetAngle',
      'performance.polarVelocityMadeGoodRatio',
      'performance.polarSpeedRatio'
    ]
  },
  {
    name: 'PNKEP99',
    title: 'PNKEP,99 - Debug',
    keys: [
      'environment.wind.angleApparent',
      'environment.wind.speedApparent',
      'environment.wind.angleTrueWater',
      'environment.wind.speedTrue',
      'navigation.speedThroughWater',
      'performance.polarSpeed',
      'performance.polarSpeedRatio'
    ]
  },
  {
    name: 'PSILCD1',
    title:
      'PSILCD1 - Send polar speed and target wind angle to Silva/Nexus/Garmin displays',
    keys: ['performance.polarSpeed', 'performance.targetAngle']
  },
  {
    name: 'PSILTBS',
    title: 'PSILTBS - Garmin proprietary target boat speed',
    keys: ['performance.targetSpeed']
  },
  {
    name: 'RMB',
    sentence: 'RMB',
    title: 'RMB - Heading and distance to waypoint',
    keys: [
      'navigation.course.calcValues.crossTrackError',
      'navigation.course.nextPoint',
      'navigation.course.calcValues.distance',
      'navigation.course.calcValues.bearingTrue',
      'navigation.course.calcValues.velocityMadeGood',
      'navigation.course.previousPoint'
    ]
  },
  {
    name: 'RMC',
    sentence: 'RMC',
    title: 'RMC - GPS recommended minimum',
    keys: [
      'navigation.datetime',
      'navigation.speedOverGround',
      'navigation.courseOverGroundTrue',
      'navigation.position',
      'navigation.magneticVariation'
    ]
  },
  {
    name: 'ROT',
    sentence: 'ROT',
    title: 'ROT - Rate of Turn',
    keys: ['navigation.rateOfTurn']
  },
  {
    name: 'RSA',
    sentence: 'RSA',
    title: 'RSA - Rudder Sensor Angle',
    keys: ['steering.rudderAngle']
  },
  {
    name: 'VHW',
    sentence: 'VHW',
    title: 'VHW - Speed and direction',
    keys: [
      'navigation.headingTrue',
      'navigation.magneticVariation',
      'navigation.speedThroughWater'
    ]
  },
  {
    name: 'VLW',
    sentence: 'VLW',
    title: 'VLW - Total log and daily log',
    keys: ['navigation.log', 'navigation.trip.log']
  },
  {
    name: 'VPW',
    sentence: 'VPW',
    title: 'VPW - Speed – Measured Parallel to Wind',
    keys: ['performance.velocityMadeGood']
  },
  {
    name: 'VTG',
    sentence: 'VTG',
    title: 'VTG - Track made good and Ground Speed (COG,SOG)',
    keys: [
      'navigation.courseOverGroundMagnetic',
      'navigation.courseOverGroundTrue',
      'navigation.speedOverGround'
    ]
  },
  {
    name: 'VWR',
    sentence: 'VWR',
    title: 'VWR - Apparent wind angle and speed',
    keys: ['environment.wind.speedApparent', 'environment.wind.angleApparent']
  },
  {
    name: 'VWT',
    sentence: 'VWT',
    title: 'VWT - True wind speed relative to boat.',
    keys: ['environment.wind.angleTrueWater', 'environment.wind.speedTrue']
  },
  {
    name: 'XDRBaro',
    title: 'XDR (Barometer) - Atmospheric Pressure',
    keys: ['environment.outside.pressure']
  },
  {
    name: 'XDRNA',
    title: 'XDR (PTCH-ROLL) - Pitch and Roll',
    keys: ['navigation.attitude']
  },
  {
    name: 'XDRTemp',
    title: 'XDR (TempAir) - Air temperature.',
    keys: ['environment.outside.temperature']
  },
  {
    name: 'XTE-GC',
    title: 'XTE - Cross-track error (w.r.t. Great Circle)',
    keys: ['navigation.courseGreatCircle.crossTrackError']
  },
  {
    name: 'XTE',
    title: 'XTE - Cross-track error (w.r.t. Rhumb line)',
    keys: ['navigation.course.calcValues.crossTrackError']
  },
  {
    name: 'ZDA',
    title: 'ZDA - UTC time and date',
    keys: ['navigation.datetime']
  }
]

describe('sentence encoder metadata', function () {
  expectations.forEach(({ name, sentence, title, keys }) => {
    describe(name, function () {
      const enc = load(name)
      it('has the expected title', function () {
        assert.equal(enc.title, title)
      })
      it('has the expected Signal K keys in the expected order', function () {
        assert.deepStrictEqual(enc.keys, keys)
      })
      if (sentence !== undefined) {
        it(`has sentence id '${sentence}'`, function () {
          assert.equal(enc.sentence, sentence)
        })
      } else {
        it('has no sentence id (pass-through module)', function () {
          assert.strictEqual(enc.sentence, undefined)
        })
      }
    })
  })

  describe('VWR exposes a legacy optionKey', function () {
    it("optionKey is 'VWR'", function () {
      assert.equal(load('VWR').optionKey, 'VWR')
    })
  })
})
