/*
UTC time and date:
$--ZDA,hhmmss.ss,dd,mm,yyyy,zz,zz*hh
       |         |  |  |    |  |_Local zone minutes (empty when reporting UTC)
       |         |  |  |    |_Local zone hours (empty when reporting UTC)
       |         |  |  |_Year (4-digit)
       |         |  |_Month (01-12)
       |         |_Day (01-31)
       |_UTC time

Example: $IIZDA,200006.00,15,08,2014,,*7E
*/
const nmea = require('../nmea.js')
const { formatDatetime } = nmea
module.exports = function (app) {
  return {
    title: 'ZDA - UTC time and date',
    keys: ['navigation.datetime'],
    f: function (datetime8601) {
      const datetime = formatDatetime(datetime8601)
      return nmea.toSentence([
        '$IIZDA',
        datetime.time,
        datetime.day,
        datetime.month,
        datetime.year,
        '',
        ''
      ])
    }
  }
}
