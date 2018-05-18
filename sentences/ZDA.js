/*
UTC time and date:
$IIZDA,hhmmss.ss,xx,xx,xxxx,,*hh
 I I I I_Year
 I I I_Month
 I I_Day
 I_Time
 */
// NMEA0183 Encoder ZDA   $IIZDA,200006.020,15,08,2014,,*4C
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'ZDA - UTC time and date',
    keys: ['navigation.datetime'],
    f: function (datetime8601) {
      var datetime = new Date(datetime8601)
      var hours = ('00' + datetime.getUTCHours()).slice(-2)
      var minutes = ('00' + datetime.getUTCMinutes()).slice(-2)
      var seconds = ('00' + datetime.getUTCSeconds()).slice(-2)
      var day = ('00' + datetime.getUTCDate()).slice(-2)
      var month = ('00' + (datetime.getUTCMonth() + 1)).slice(-2)
      return nmea.toSentence([
        '$IIZDA',
        hours + minutes + seconds + '.020',
        day,
        month,
        datetime.getUTCFullYear(),
        '',
        ''
      ])
    }
  }
}
