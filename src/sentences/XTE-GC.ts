/*
Cross-track error:
$IIXTE,A,A,x.x,a,N,A*hh
 I_Cross-track error in miles, L= left, R= right
 */
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder<[number]> {
  return {
    title: 'XTE - Cross-track error (w.r.t. Great Circle)',
    keys: ['navigation.courseGreatCircle.crossTrackError'],
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
