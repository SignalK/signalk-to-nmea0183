// NMEA0183 Encoder HDT   $IIHDT,200.1,T*21
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'HDT - Heading True',
    keys: ['navigation.headingTrue'],
    f: function (heading) {
      return nmea.toSentence([
        '$IIHDT',
        nmea.radsToDeg(heading).toFixed(1),
        'T'
      ])
    }
  }
}
