/*
Cross-track error (subscribes alongside XTE for legacy config compat).

$IIXTE,A,A,x.x,a,N,A*hh
 I_Cross-track error in miles, L= left, R= right

Historically this encoder subscribed to `navigation.courseGreatCircle.crossTrackError`
to provide a great-circle-specific XTE. Modern signalk-server (>= 2.x)
publishes a single cross-track error at `navigation.course.calcValues.cross
TrackError` which reflects whichever calcMethod is configured server-side
(GreatCircle or Rhumbline), so this encoder now subscribes to that same
path. It is functionally equivalent to the regular XTE encoder; both are
kept so existing user configs that enable `XTE-GC: true` continue to emit.
Enable only one to avoid duplicate sentences on the bus.
*/
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder<[number]> {
  return {
    title: 'XTE - Cross-track error (w.r.t. server-configured calcMethod)',
    keys: ['navigation.course.calcValues.crossTrackError'],
    f: function (crossTrackError: number): string {
      return nmea.toSentence([
        '$IIXTE',
        'A',
        'A',
        Math.abs(nmea.mToNm(crossTrackError)).toFixed(3),
        crossTrackError < 0 ? 'R' : 'L',
        'N'
      ])
    }
  }
}
