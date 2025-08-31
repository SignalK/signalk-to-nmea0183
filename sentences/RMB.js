/*
Heading and distance to waypoint:
                                                             14
        1 2   3 4    5    6       7 8        9 10  11  12  13|  15
        | |   | |    |    |       | |        | |   |   |   | |   |
 $--RMB,A,x.x,a,c--c,c--c,llll.ll,a,yyyyy.yy,a,x.x,x.x,x.x,A,m,*hh<CR><LF>
------------------------------------------------------------------------------

Field Number:

1. Status, A= Active, V = Void
2. Cross Track error - nautical miles
3. Direction to Steer, Left or Right
4. TO Waypoint ID
5. FROM Waypoint ID
6. Destination Waypoint Latitude
7. N or S
8. Destination Waypoint Longitude
9. E or W
10. Range to destination in nautical miles
11. Bearing to destination in degrees True
12. Destination closing velocity in knots
13. Arrival Status, A = Arrival Circle Entered
14. FAA mode indicator (NMEA 2.3 and later)
15. Checksum
*/

const nmea = require('../nmea.js')
module.exports = function (app) {

  const apiVersion = app.config.version ? parseInt(app.config.version.split('.')[0]) : 1
  const keys = apiVersion > 1
    ? [
      'navigation.course.nextPoint',
      'navigation.course.calcValues.crossTrackError',
      'navigation.course.calcValues.distance',
      'navigation.course.calcValues.bearingTrue',
      'navigation.course.calcValues.velocityMadeGood'
    ]
    : [
      'navigation.courseGreatCircle.nextPoint.position',
      'navigation.courseGreatCircle.crossTrackError',
      'navigation.courseGreatCircle.nextPoint.distance',
      'navigation.courseGreatCircle.nextPoint.bearingTrue',
      'navigation.courseGreatCircle.nextPoint.velocityMadeGood'
    ]
    
  return {
    sentence: 'RMB',
    title: 'RMB - Heading and distance to waypoint',
    keys,
    f: function (
      np,
      crossTrackError,
      wpDistance,
      bearingTrue,
      vmgWpt
    ) {
      return nmea.toSentence([
        '$IIRMB',
        'A',
        Math.abs(nmea.mToNm(crossTrackError)).toFixed(2),      
        crossTrackError < 0 ? 'R' : 'L',
        '',
        '',
        nmea.toNmeaDegreesLatitude(np.position.latitude),
        nmea.toNmeaDegreesLongitude(np.position.longitude),
        Math.abs(nmea.mToNm(wpDistance)).toFixed(2),
        nmea.radsToPositiveDeg(bearingTrue).toFixed(0),
        nmea.msToKnots(vmgWpt).toFixed(2),
        '',
        'A'
      ])
    }
  }
}
