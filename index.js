const Bacon = require('baconjs');

module.exports = function(app) {
  var plugin = {
    unsubscribes: []
  };

  plugin.id = "sk-to-nmea0183"
  plugin.name = "Convert Signal K to NMEA0183"
  plugin.description = "Plugin to convert Signal K to NMEA0183"

  plugin.schema = {
    type: "object",
    title: "Conversions to NMEA0183",
    description: "If there is SK data for the conversion generate the following NMEA0183 sentences from Signal K data:",
    properties: {}
  }
  
  plugin.start = function(options) {
    const selfContext = 'vessels.' + app.selfId
    const selfMatcher = (delta) => delta.context && delta.context === selfContext

    function mapToNmea(encoder) {
      const selfStreams = encoder.keys.map(app.streambundle.getSelfStream, app.streambundle)
      plugin.unsubscribes.push(Bacon.combineWith(encoder.f, selfStreams).changes().debounceImmediate(20).onValue(nmeaString => {
        app.emit('nmea0183out', nmeaString)
      }))
    }

    Object.keys(plugin.sentences).forEach(name => {
      if ( options[name] )
      {
        mapToNmea(plugin.sentences[name]);
      }
    })
  }

  plugin.stop = function() {
    plugin.unsubscribes.forEach(f => f())
  }

  plugin.sentences = {
    /*
      === MWV - Wind Speed and Angle ===

      ------------------------------------------------------------------------------
      1   2 3   4 5
      |   | |   | |
      $--MWV,x.x,a,x.x,a*hh<CR><LF>
      ------------------------------------------------------------------------------

      Field Number:

      1. Wind Angle, 0 to 360 degrees
      2. Reference, R = Relative, T = True
      3. Wind Speed
      4. Wind Speed Units, K/M/N
      5. Status, A = Data Valid
      6. Checksum
    */

    MWV: {
      title: "MWV - Wind heading and speed",
      keys: [
        'environment.wind.angleApparent', 'environment.wind.speedApparent'
      ],
      f: function mwv(angle, speed) {
        return toSentence([
          '$SKMWV',
          radsToDeg(angle).toFixed(1),
          'R',
          speed.toFixed(1),
          'M',
          'A'
        ]);
      }
    },

    /*
      ------------------------------------------------------------------------------
      13    15
      1 2 3   4 5 6 7 8   9 10   11  12|   14|
      | | |   | | | | |   | |    |   | |   | |
      $--APB,A,A,x.x,a,N,A,A,x.x,a,c--c,x.x,a,x.x,a*hh<CR><LF>
      ------------------------------------------------------------------------------

      Field Number:

      1. Status
      V = LORAN-C Blink or SNR warning
      V = general warning flag or other navigation systems when a reliable
      fix is not available
      2. Status
      V = Loran-C Cycle Lock warning flag
      A = OK or not used
      3. Cross Track Error Magnitude
      4. Direction to steer, L or R
      5. Cross Track Units, N = Nautical Miles
      6. Status
      A = Arrival Circle Entered
      7. Status
      A = Perpendicular passed at waypoint
      8. Bearing origin to destination
      9. M = Magnetic, T = True
      10. Destination Waypoint ID
      11. Bearing, present position to Destination
      12. M = Magnetic, T = True
      13. Heading to steer to destination waypoint
      14. M = Magnetic, T = True
      15. Checksum

      Example: $GPAPB,A,A,0.10,R,N,V,V,011,M,DEST,011,M,011,M*82
    */
    APB: {
      title: "APB - Autopilot info",
      keys: [
        'navigation.courseGreatCircle.crossTrackError', 'navigation.courseGreatCircle.bearingTrackTrue', 'navigation.courseGreatCircle.nextPoint'
      ],
      f: function(xte, originToDest, nextPoint) {
        return toSentence([
          '$SKAPB', 'A', 'A', Math.abs(xte), xte > 0
            ? 'L'
            : 'R',
          'M',
          'V',
          'V',
          (originToDest / Math.PI * 180).toFixed(0),
          'T',
          '00',
          (nextPoint.bearingTrue / Math.PI * 180).toFixed(0),
          'T',
          (nextPoint.bearingTrue / Math.PI * 180).toFixed(0),
          'T'
        ]);
      }
    },

    /*
      RMC - Recommended Minimum Navigation Information
      This is one of the sentences commonly emitted by GPS units.

      12
      1         2 3       4 5        6  7   8   9    10 11|  13
      |         | |       | |        |  |   |   |    |  | |   |
      $--RMC,hhmmss.ss,A,llll.ll,a,yyyyy.yy,a,x.x,x.x,xxxx,x.x,a,m,*hh<CR><LF>
      Field Number:
      1 UTC Time
      2 Status, V=Navigation receiver warning A=Valid
      3 Latitude
      4 N or S
      5 Longitude
      6 E or W
      7 Speed over ground, knots
      8 Track made good, degrees true
      9 Date, ddmmyy
      10 Magnetic Variation, degrees
      11 E or W
      12 FAA mode indicator (NMEA 2.3 and later)
      13 Checksum
    */

    RMC: {
      title: "RMC - GPS recommended minimum",
      keys: [
        'navigation.datetime', 'navigation.speedOverGround', 'navigation.courseOverGroundTrue', 'navigation.position'
      ],
      f: function(datetime8601, sog, cog, position) {
        var datetime = new Date(datetime8601);
        var hours = ('00' + datetime.getHours()).slice(-2);
        var minutes = ('00' + datetime.getMinutes()).slice(-2);
        var seconds = ('00' + datetime.getSeconds()).slice(-2);
        return toSentence([
          '$SKRMC', hours + minutes + seconds + '.020',
          'A',
          toNmeaDegrees(position.latitude),
          position.latitude < 0 ? 'S' : 'N',
          toNmeaDegrees(position.longitude),
          position.longitude < 0 ? 'W' : 'E',
          (sog * 1.94384).toFixed(1),
          radsToDeg(cog).toFixed(1),
          '0000',
          '7.0',
          'E'
        ]);
      }
    },

    /*
      PSILTBS - Proprietary target boat speed sentence for Silva => Nexus => Garmin displays


      0     1  2
      |     |  |
      $PSILTBS,XX.xx,N,*hh<CR><LF>
      Field Number:
      0 Target Boat speed in knots
      1 N for knots
      2 Checksum
    */
    
    PSILTBS: {
      title: "PSILTBS - Send target boat speed to Silva/Nexus/Garmin displays",
      keys: [
        'performance.targetSpeed'
      ],
      f: function(tbs) {
        return toSentence([
          '$PSILTBS',
          (tbs * 1.94384).toFixed(1),
          'N'
        ]);
      }
    },

    /*
      PSILCD1 - Proprietary polar boat speed sentence for Silva => Nexus => Garmin displays


      0     1     2
      |     |     |
      $PSILCD1,XX.xx,YY.yy,*hh<CR><LF>
      Field Number:
      0 Polar Boat speed in knots
      1 Target wind angle
      2 Checksum
    */

    PSILCD1: {
      title: "PSILCD1 - Send polar speed and target wind angle to Silva/Nexus/Garmin displays",
      keys: [
        'performance.polarSpeed', 'performance.targetAngle'
      ],
      f: function(polarSpeed, targetAngle) {
        return toSentence([
          '$PSILCD1',
          (polarSpeed * 1.94384).toFixed(2),
          (targetAngle / Math.PI * 180).toFixed(0)
        ]);
      }
    },

    HDT: {
      title: "HDT - Heading True",
      keys: [
        'navigation.headingTrue'
      ],
      f: function mwv(heading) {
        return toSentence([
          '$SKHDT',
          radsToDeg(heading).toFixed(1),
          'T'
        ]);
      }
    },

    HDM: {
      title: "HDM - Heading Magnetic",
      keys: [
        'navigation.headingMagnetic'
      ],
      f: function mwv(heading) {
        return toSentence([
          '$SKHDM',
          radsToDeg(heading).toFixed(1),
          'M'
        ]);
      }
    },

    ROT: {
      title: "ROT - Rate of Turn",
      keys: [
        'navigation.rateOfTurn'
      ],
      f: function mwv(rot) {
        var degm = rot * 3437.74677078493
        return toSentence([
          '$SKROT',
          degm.toFixed(1),
          'A'
        ]);
      }
    },

    DBK: {
      title: "DBK - Depth Below Keel",
      keys: [
        'environment.depth.belowKeel'
      ],
      f: function mwv(depth) {
        var feet = depth * 3.28084
        var fathoms = depth * 0.546807
        return toSentence([
          '$SKDBK',
          feet.toFixed(1),
          'f',
          depth.toFixed(2),
          'M',
          fathoms.toFixed(1),
          'F'
        ]);
      }
    },

    DBS: {
      title: "DBK - Depth Below Surface",
      keys: [
        'environment.depth.belowSurface'
      ],
      f: function mwv(depth) {
        var feet = depth * 3.28084
        var fathoms = depth * 0.546807
        return toSentence([
          '$SKDBS',
          feet.toFixed(1),
          'f',
          depth.toFixed(2),
          'M',
          fathoms.toFixed(1),
          'F'
        ]);
      }
    },

    DBT: {
      title: "DBK - Depth Below Transducer",
      keys: [
        'environment.depth.belowTransducer'
      ],
      f: function mwv(depth) {
        var feet = depth * 3.28084
        var fathoms = depth * 0.546807
        return toSentence([
          '$SKDBT',
          feet.toFixed(1),
          'f',
          depth.toFixed(2),
          'M',
          fathoms.toFixed(1),
          'F'
        ]);
      }
    },

    MTW: {
      title: "MTW - Water Temperature",
      keys: [
        'environment.water.temperature'
      ],
      f: function mwv(temperature) {
        var celcius = temperature + 273.15;
        return toSentence([
          '$SKMTW',
          celcius.toFixed(1),
          'C'
        ]);
      }
    }
  };

  //===========================================================================
  
  Object.keys(plugin.sentences).forEach(key => {
    sentence = plugin.sentences[key]
    plugin.schema.properties[key] = {
      title: sentence['title'],
      type: "boolean",
      default: false
    }
  });

  return plugin
}


function toSentence(parts) {
  var base = parts.join(',');
  return base + computeChecksum(base);
}
var m_hex = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F'
];

function computeChecksum(sentence) {
  var c1;
  var i;

  // skip the $
  i = 1;

  // init to first character    var count;

  c1 = sentence.charCodeAt(i);

  // process rest of characters, zero delimited
  for (i = 2; i < sentence.length; ++i) {
    c1 = c1 ^ sentence.charCodeAt(i);
  }

  return '*' + toHexString(c1);
};

function toHexString(v) {
  var lsn;
  var msn;

  msn = (v >> 4) & 0x0f;
  lsn = (v >> 0) & 0x0f;
  return m_hex[msn] + m_hex[lsn];
};

function radsToDeg(radians) {
  return radians * 180 / Math.PI
}

function padd(n, p, c)
{
  var pad_char = typeof c !== 'undefined' ? c : '0';
  var pad = new Array(1 + p).join(pad_char);
  return (pad + n).slice(-pad.length);
}

function toNmeaDegrees(val)
{
  val = Math.abs(val)
  var minutes = Math.floor(val)
  var minutes_decimal = val % 1
  minutes_decimal *= 60.0;
  return padd(minutes.toFixed(0),2) + padd(minutes_decimal.toFixed(4), 7)
}
