// to verify

const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    sentence: 'ROT',
    title: 'ROT - Rate of Turn',
    keys: ['navigation.rateOfTurn'],
    f: function (rot) {
      var degm = rot * 3437.74677078493
      return nmea.toSentence(['$IIROT', degm.toFixed(2), 'A'])
    }
  }
}
