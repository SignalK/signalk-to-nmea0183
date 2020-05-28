const assert = require('assert')

const {createAppWithPlugin} = require ('./testutil')

describe('GNS', function() {

  it('works with sample values', done=> {
     const onEmit = (event, value) => {
        assert.equal(value ,'$GPGNS,112257.00,3844.2401,S,00908.4383,W,A,03,10.5,,,,*0C')
	     done()
     }
     const app = createAppWithPlugin(onEmit, 'GNS')
     app.streambundle.getSelfStream('navigation.datetime').push('2015-12-11T09:22:57Z')
     app.streambundle.getSelfStream('navigation.gnss.methodQuality').push('DGNSS fix')
     app.streambundle.getSelfStream('navigation.gnss.satellites').push(3)
     app.streambundle.getSelfStream('navigation.gnss.horizontalDilution').push(10.5)
     app.streambundle.getSelfStream('navigation.gnss.antennaAltitude').push(18.893)
     app.streambundle.getSelfStream('navigation.gnss.geoidalSeparation').push(-25.669)
     app.streambundle.getSelfStream('navigation.gnss.differentialAge').push(2.0)
     app.streambundle.getSelfStream('navigation.gnss.differentialReference').push('0031')
     app.streambundle.getSelfStream('navigation.position').push({ longitude: -9.140638, latitude: -38.73733517 })
  }) 
}) 
