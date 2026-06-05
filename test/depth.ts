import * as assert from 'assert'
import { createAppWithPlugin } from './testutil'

describe('Depth Sentences', function () {
  describe('DBK', () => {
    it('emits depth below keel in feet, meters, and fathoms', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(value, '$IIDBK,32.8,f,10.00,M,5.5,F*39')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'DBK')
      app.streambundle.getSelfStream('environment.depth.belowKeel').push(10)
    })
  })

  describe('DBS', () => {
    it('emits depth below surface in feet, meters, and fathoms', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(value, '$IIDBS,32.8,f,10.00,M,5.5,F*3E')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'DBS')
      app.streambundle.getSelfStream('environment.depth.belowSurface').push(10)
    })
  })

  describe('DPT', () => {
    it('emits depth and negative offset for keel', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(value, '$IIDPT,10.00,-1.500,*47')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'DPT')
      app.streambundle.getSelfStream('environment.depth.belowTransducer').push(10)
      app.streambundle.getSelfStream('environment.depth.transducerToKeel').push(1.5)
    })

    it('defaults offset to 0 if transducerToKeel is missing', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(value, '$IIDPT,10.00,0.000,*41')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'DPT')
      app.streambundle.getSelfStream('environment.depth.belowTransducer').push(10)
    })
  })

  describe('DPT-surface', () => {
    it('emits depth and positive offset for surface', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(value, '$IIDPT,10.00,1.500,*59')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'DPT-surface')
      app.streambundle.getSelfStream('environment.depth.belowTransducer').push(10)
      app.streambundle.getSelfStream('environment.depth.surfaceToTransducer').push(1.5)
    })
  })

  describe('Guard Clauses', () => {
    it('does not emit when depth is NaN', (done) => {
      let emitted = false
      const onEmit = () => { emitted = true }
      const app = createAppWithPlugin(onEmit, 'DBT')
      app.streambundle.getSelfStream('environment.depth.belowTransducer').push(NaN)
      setTimeout(() => {
        assert.equal(emitted, false)
        done()
      }, 50)
    })
  })
})