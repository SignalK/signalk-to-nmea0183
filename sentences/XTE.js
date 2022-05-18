/*
Cross-track error:
$IIXTE,A,A,x.x,a,N,A*hh
 I_Cross-track error in miles, L= left, R= right
 */
// to verify
const nmea = require('../nmea.js')
module.exports = function (app) {

  const apiVersion = app.config.version ? parseInt(app.config.version.split('.')[0]) : 1
  const keys = apiVersion === 2
    ? ['navigation.course.calcValues.crossTrackError']
    : ['navigation.courseGreatCircle.crossTrackError']

  return {
    title: 'XTE - Cross-track error',
    keys: keys,
    f: function (crossTrackError) {
      return nmea.toSentence([
        '$IIXTE',
        'A',
        'A',
        nmea.mToNm(crossTrackError).toFixed(3),
        crossTrackError < 0 ? 'R' : 'L',
        'N'
      ])
    }
  }
}
