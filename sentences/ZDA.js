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
      const datetime = formatDatetime(datetime8601);
      return nmea.toSentence([
        '$IIZDA',
        datetime.time + '.020',
        datetime.day,
        datetime.month,
        datetime.year,
        '',
        ''
      ])
    }
  }
}
