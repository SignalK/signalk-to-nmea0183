import * as assert from 'assert'

import { generateWaypointName } from '../src/waypointNameGenerator'

describe('generateWaypointName', function () {
  describe('forwards the server-provided point.name', function () {
    it('returns the name verbatim when present', function () {
      assert.strictEqual(
        generateWaypointName({ name: 'NASSAU', type: 'Waypoint' }),
        'NASSAU'
      )
    })

    it('forwards the server defaults unchanged (WP<n> / DP / VP)', function () {
      // signalk-server fills these defaults itself; the plugin passes them through.
      assert.strictEqual(
        generateWaypointName({ name: 'WP2', type: 'RoutePoint' }),
        'WP2'
      )
      assert.strictEqual(
        generateWaypointName({ name: 'DP', type: 'Location' }),
        'DP'
      )
      assert.strictEqual(
        generateWaypointName({ name: 'VP', type: 'VesselPosition' }),
        'VP'
      )
    })
  })

  describe('returns an empty string when no name is available', function () {
    it('empty for a typed point with no name', function () {
      assert.strictEqual(generateWaypointName({ type: 'RoutePoint' }), '')
    })

    it('empty for an empty object', function () {
      assert.strictEqual(generateWaypointName({}), '')
    })

    it('empty for null', function () {
      assert.strictEqual(generateWaypointName(null), '')
    })

    it('empty for undefined', function () {
      assert.strictEqual(generateWaypointName(undefined), '')
    })

    it('empty when name is an empty string', function () {
      assert.strictEqual(generateWaypointName({ name: '' }), '')
    })
  })

  describe('NMEA framing-character defenses', function () {
    it('strips comma, asterisk, dollar, CR, LF from name', function () {
      assert.strictEqual(
        generateWaypointName({ name: 'A,B*C$D\rE\nF' }),
        'ABCDEF'
      )
    })

    it('truncates names longer than 20 characters', function () {
      assert.strictEqual(
        generateWaypointName({
          name: 'A_VERY_LONG_WAYPOINT_NAME_THAT_OVERFLOWS'
        }),
        'A_VERY_LONG_WAYPOINT'
      )
    })
  })
})
