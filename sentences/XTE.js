
 /*
Cross-track error:
$IIXTE,A,A,x.x,a,N,A*hh
 I_Cross-track error in miles, L= left, R= right
 */
// to verify
const nmea = require('../nmea.js');
module.exports = function(app) {
  return {
      title: "XTE - Cross-track error",
      keys: [
        'navigation.courseRhumbline.crossTrackError'
      ],
      f: function gll(crossTrackError) {
        return nmea.toSentence([
          '$IIXTE',
          'A',
          'A',
          crossTrackError.toFixed(3),
          crossTrackError<0?'R':'L',
          'N'
        ]);
      }
  };
}
