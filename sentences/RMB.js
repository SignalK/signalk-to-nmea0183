/*
Heading and distance to waypoint:
$IIRMB,A,x.x,a,,,IIII.II,a,yyyyy.yy,a,x.x,x.x,x.x,A,a*hh
 I I I I I I I I I_Speed to WP in knots
 I I I I I I I I_True heading to destination in degrees
 I I I I I I I_Distance to destination in miles
 I I I I I_ ___ I_Longitude of the WP destination, E/W
 I I I__ I_Latitude of the WP destination, N/S
 I I_Direction of cross-track error, L/R
 I_Distance of cross-track error in miles
*/
// to verify
const nmea = require('../nmea.js')
module.exports = function (app) {

  const apiVersion = app.config.version ? parseInt(app.config.version.split('.')[0]) : 1
  const waypointPath = apiVersion > 1
    ? 'navigation.course.nextPoint.position' 
    : 'navigation.courseGreatCircle.nextPoint.position'
  const keys = apiVersion > 1
    ? [
      'navigation.course.calcValues.crossTrackError',
      'navigation.course.calcValues.distance',
      'navigation.course.calcValues.bearingTrue'
    ]
    : [
      'navigation.courseGreatCircle.crossTrackError',
      'navigation.courseGreatCircle.nextPoint.distance',
      'navigation.courseGreatCircle.nextPoint.bearingTrue'
    ]

  return {
    sentence: 'RMB',
    title: 'RMB - Heading and distance to waypoint',
    keys: keys,
    f: function (
      crossTrackError,
      wpDistance,
      bearingTrue
    ) {
      const wp = app.getSelfPath(waypointPath)
      if (!wp) return
      return nmea.toSentence([
        '$IIRMB',
        crossTrackError.toFixed(2),
        crossTrackError < 0 ? 'R' : 'L',
        nmea.toNmeaDegreesLatitude(wp.value.latitude),
        nmea.toNmeaDegreesLongitude(wp.value.longitude),
        wpDistance.toFixed(2),
        nmea.radsToDeg(bearingTrue).toFixed(2),
        'V', // dont set the arrival flag as it will set of alarms.
        ''
      ])
    }
  }

}
