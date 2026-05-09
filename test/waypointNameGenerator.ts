import * as assert from 'assert'

import { generateWaypointName } from '../src/waypointNameGenerator'

describe('generateWaypointName', function () {
  describe('priority: point.name wins over fallback', function () {
    it('uses nextPoint.name when present', function () {
      assert.strictEqual(
        generateWaypointName(
          { name: 'NASSAU', type: 'Waypoint' },
          { name: 'Bahamas Cruise', pointIndex: 2 }
        ),
        'NASSAU'
      )
    })
  })

  describe('RoutePoint fallback uses activeRoute.pointIndex', function () {
    it('synthesizes "WP1" for pointIndex 0', function () {
      assert.strictEqual(
        generateWaypointName(
          { type: 'RoutePoint' },
          { name: 'Bahamas', pointIndex: 0 }
        ),
        'WP1'
      )
    })
    it('synthesizes "WP3" for pointIndex 2', function () {
      assert.strictEqual(
        generateWaypointName({ type: 'RoutePoint' }, { pointIndex: 2 }),
        'WP3'
      )
    })
    it('synthesizes "WP6" for pointIndex 5 even without route name', function () {
      assert.strictEqual(
        generateWaypointName({ type: 'RoutePoint' }, { pointIndex: 5 }),
        'WP6'
      )
    })
    it('falls back to "WP1" for RoutePoint when pointIndex is missing', function () {
      assert.strictEqual(
        generateWaypointName({ type: 'RoutePoint' }, null),
        'WP1'
      )
    })
  })

  describe('type-specific defaults (mirrors signalk-server #2608)', function () {
    it('returns "DP" for direct-to-Location', function () {
      assert.strictEqual(generateWaypointName({ type: 'Location' }, null), 'DP')
    })
    it('returns "VP" for previous VesselPosition', function () {
      assert.strictEqual(
        generateWaypointName({ type: 'VesselPosition' }, null),
        'VP'
      )
    })
    it('returns "WP1" for direct-to-Waypoint with no name', function () {
      assert.strictEqual(
        generateWaypointName(
          { type: 'Waypoint', href: '/resources/waypoints/abc-123' },
          null
        ),
        'WP1'
      )
    })
    it('returns "WP1" for unknown / missing type', function () {
      assert.strictEqual(generateWaypointName({}, null), 'WP1')
    })
    it('returns "WP1" for null nextPoint and null activeRoute', function () {
      assert.strictEqual(generateWaypointName(null, null), 'WP1')
    })
  })

  describe('NMEA framing-character defenses', function () {
    it('strips comma, asterisk, dollar, CR, LF from name', function () {
      assert.strictEqual(
        generateWaypointName({ name: 'A,B*C$D\rE\nF' }, null),
        'ABCDEF'
      )
    })
    it('truncates names longer than 20 characters', function () {
      assert.strictEqual(
        generateWaypointName(
          { name: 'A_VERY_LONG_WAYPOINT_NAME_THAT_OVERFLOWS' },
          null
        ),
        'A_VERY_LONG_WAYPOINT'
      )
    })
  })

  describe('robustness against partial/undefined inputs', function () {
    it('treats undefined nextPoint as empty object', function () {
      assert.strictEqual(
        generateWaypointName(undefined, { pointIndex: 0 }),
        'WP1'
      )
    })
    it('treats undefined activeRoute as empty object', function () {
      assert.strictEqual(generateWaypointName({ name: 'X' }, undefined), 'X')
    })
    it('ignores non-numeric pointIndex (falls back to type default)', function () {
      assert.strictEqual(
        generateWaypointName(
          { type: 'RoutePoint' },
          { pointIndex: '1' as unknown as number }
        ),
        'WP1'
      )
    })
  })
})
