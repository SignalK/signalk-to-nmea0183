/*
Cross-track error:
$IIXTE,A,A,x.x,a,N,A*hh
 I_Cross-track error in miles, L= left, R= right
 */
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'XTE',
    title: 'XTE - Cross-track error (w.r.t. Rhumb line)',
    keys: ['navigation.course.calcValues.crossTrackError'],
    defaults: [null],
    f: function xte(
      crossTrackError: number | null | undefined
    ): string | undefined {
      if (
        crossTrackError === null ||
        crossTrackError === undefined ||
        isNaN(crossTrackError)
      ) {
        return undefined
      }

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
