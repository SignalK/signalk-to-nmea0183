module.exports = function() {
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

  function msToKnots(v) { 
    return v*3600/1852.0; 
  }

  function msToKM(v) { 
    return v*3600.0/1000.0; 
  }

  function mToNm(v) {
    return v*0.000539957;
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

  function fixAngle(d) {
    if ( d > Math.PI ) d = d - Math.PI;
    if ( d < -Math.PI) d = d + Math.PI;
    return d;
  }
  return {
    toSentence: toSentence,
    radsToDeg: radsToDeg,
    msToKnots: msToKnots,
    msToKM: msToKM,
    toNmeaDegrees: toNmeaDegrees,
    fixAngle: fixAngle    
  };
}();