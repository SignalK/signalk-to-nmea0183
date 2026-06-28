import { testSequential, testSuppressed } from './testutil'

/**
 * MWV - Wind Speed and Angle (relative / true)
 *
 * $IIMWV,angle,a,speed,M,A*cs   (a = R relative, T true)
 *
 * Both Signal K inputs default to MISSING so the combined stream fires as
 * soon as either path emits.  Non-finite values are treated as absent and
 * produce empty fields; when neither field can be populated the sentence is
 * suppressed.
 *
 * Checksums generated from the encoder and verified independently.
 * See test/testutil.ts for the BaconJS timing rationale behind testSequential.
 */

describe('MWV relative', function () {
  this.timeout(300)

  it('works with positive angle', (done) => {
    testSequential(
      'MWVR',
      [
        { path: 'environment.wind.angleApparent', value: Math.PI },
        { path: 'environment.wind.speedApparent', value: 2 }
      ],
      '$IIMWV,180.00,R,2.00,M,A*35',
      done
    )
  })

  it('works with negative angle', (done) => {
    testSequential(
      'MWVR',
      [
        { path: 'environment.wind.angleApparent', value: -Math.PI / 2 },
        { path: 'environment.wind.speedApparent', value: 2 }
      ],
      '$IIMWV,270.00,R,2.00,M,A*39',
      done
    )
  })

  it('leaves the speed field empty when speed is absent', (done) => {
    testSequential(
      'MWVR',
      [{ path: 'environment.wind.angleApparent', value: Math.PI }],
      '$IIMWV,180.00,R,,M,A*29',
      done
    )
  })

  it('treats a non-finite speed as absent (empty field, not NaN)', (done) => {
    testSequential(
      'MWVR',
      [
        { path: 'environment.wind.angleApparent', value: Math.PI },
        { path: 'environment.wind.speedApparent', value: NaN }
      ],
      '$IIMWV,180.00,R,,M,A*29',
      done
    )
  })

  it('suppresses the sentence when both values are non-finite', (done) => {
    testSuppressed(
      'MWVR',
      [
        { path: 'environment.wind.angleApparent', value: NaN },
        { path: 'environment.wind.speedApparent', value: Infinity }
      ],
      done
    )
  })
})

describe('MWV true', function () {
  this.timeout(300)

  it('works with positive angle', (done) => {
    testSequential(
      'MWVT',
      [
        { path: 'environment.wind.angleTrueWater', value: Math.PI },
        { path: 'environment.wind.speedTrue', value: 2 }
      ],
      '$IIMWV,180.00,T,2.00,M,A*33',
      done
    )
  })

  it('works with negative angle', (done) => {
    testSequential(
      'MWVT',
      [
        { path: 'environment.wind.angleTrueWater', value: -Math.PI / 2 },
        { path: 'environment.wind.speedTrue', value: 2 }
      ],
      '$IIMWV,270.00,T,2.00,M,A*3F',
      done
    )
  })

  it('leaves the angle field empty when angle is absent', (done) => {
    testSequential(
      'MWVT',
      [{ path: 'environment.wind.speedTrue', value: 2 }],
      '$IIMWV,,T,2.00,M,A*24',
      done
    )
  })

  it('treats a non-finite angle as absent (empty field, not NaN)', (done) => {
    testSequential(
      'MWVT',
      [
        { path: 'environment.wind.angleTrueWater', value: NaN },
        { path: 'environment.wind.speedTrue', value: 2 }
      ],
      '$IIMWV,,T,2.00,M,A*24',
      done
    )
  })

  it('suppresses the sentence when both values are non-finite', (done) => {
    testSuppressed(
      'MWVT',
      [
        { path: 'environment.wind.angleTrueWater', value: Infinity },
        { path: 'environment.wind.speedTrue', value: NaN }
      ],
      done
    )
  })
})
