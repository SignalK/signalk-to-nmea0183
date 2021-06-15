/*
Air temperature:
$IIMTA,x.x,C*hh
 I__I_Temperature in degrees C
  */
// $IIMTA,34.80,C*3A

const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    sentence: 'MTA',
    title: 'MTA - Air temperature.',
    keys: ['environment.outside.temperature'],
    f: function (temperature) {
      // console.log("Got MTA--------------------------");
      var celcius = temperature - 273.15
      return nmea.toSentence(['$IIMTA', celcius.toFixed(2), 'C'])
    }
  }
}
