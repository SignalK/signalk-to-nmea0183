/*
Cross-track error:
$IIXTE,A,A,x.x,a,N,A*hh
 I_Cross-track error in miles, L= left, R= right
 */
// to verify
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'XTE - Cross-track error (w.r.t. Great Circle)',
    keys: ['navigation.courseGreatCircle.crossTrackError'],
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
