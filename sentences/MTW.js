

// NMEA0183 Encoder MTW   $IIMTW,40.0,C*17
const nmea = require('../nmea.js');
module.exports = function(app) {
  return {
      title: "MTW - Water Temperature",
      keys: [
        'environment.water.temperature'
      ],
      f: function mwv(temperature) {
        var celcius = temperature - 273.15;
        return nmea.toSentence([
          '$IIMTW',
          celcius.toFixed(1),
          'C'
        ]);
      }
  };
}