const assert = require('assert')

const {createAppWithPlugin} = require ('./testutil')

describe('GGA', function() {
  it('works', done=> {
     const onEmit = (event, value) => {
        assert.equal(value ,'$IIGGA,172814.0,3723.46587704,N,12202.26957864,W,2,6,1.2,18.893,M,-25.669,M,2.0,0031*58')
	done()
     }
     const app = createAppWithPlugin(onEmit, 'GGA')
     app.streambundle.getSelfStream('navigation.datetime').push('2015-12-05T17:28:14Z')
     app.streambundle.getSelfStream('navigation.position').push({ longitude: -122.03782631066667, latitude: 37.39109795066667 })
     app.streambundle.getSelfStream('navigation.gnss.methodQuality').push('DGNSS fix')
     app.streambundle.getSelfStream('navigation.gnss.satellites').push(6)
     app.streambundle.getSelfStream('navigation.gnss.horizontalDilution').push(1.2)
     app.streambundle.getSelfStream('navigation.gnss.antennaAltitude').push(18.893)
     app.streambundle.getSelfStream('navigation.gnss.geoidalSeparation').push(-25.669)
     app.streambundle.getSelfStream('navigation.gnss.differentialAge').push(2.0)
     app.streambundle.getSelfStream('navigation.gnss.differentialReference').push('0031')
  })
}) 
