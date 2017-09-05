// to verify

const nmea = require('../nmea.js');
module.exports = function(app) {
  return {
      title: "ROT - Rate of Turn",
      keys: [
        'navigation.rateOfTurn'
      ],
      f: function mwv(rot) {
        var degm = rot * 3437.74677078493
        return nmea.toSentence([
          '$SKROT',
          degm.toFixed(2),
          'A'
        ]);
      }
  };
}
