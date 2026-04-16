const path = require('path')
const fs = require('fs')

// Combine N streams into a single Property whose values are fn(v1, v2, ...vN),
// using only the instance-method .combine(other, fn) that exists on both
// baconjs 1.x and 3.x. Avoids require('baconjs') in the plugin so that
// the plugin never carries its own Bacon copy: all stream operations run on
// the Bacon instance the host signalk-server created the streams with.
//
// The seed of the reduce calls .toProperty() so the result is always a
// Property even when there is only one input stream (no .combine call to
// implicitly lift it). Downstream callers depend on .changes(), which is a
// Property-only method.
function combineStreamsWith(streams, fn) {
  const accumulated = streams.reduce((acc, stream, i) => {
    if (i === 0) return stream.toProperty().map((v) => [v])
    return acc.combine(stream, (arr, v) => arr.concat([v]))
  }, null)
  return accumulated.map((args) => fn.apply(null, args))
}

module.exports = function (app) {
  var plugin = {
    unsubscribes: []
  }

  plugin.id = 'sk-to-nmea0183'
  plugin.name = 'Convert Signal K to NMEA0183'
  plugin.description = 'Plugin to convert Signal K to NMEA0183'

  plugin.schema = {
    type: 'object',
    title: 'Conversions to NMEA0183',
    description:
      'If there is SK data for the conversion generate the following NMEA0183 sentences from Signal K data. For converting NMEA2000 AIS to NMEA 0183 use the signalk-n2kais-to-nmea0183 plugin.',
    properties: {}
  }

  plugin.start = function (options) {
    const selfContext = 'vessels.' + app.selfId
    const selfMatcher = (delta) =>
      delta.context && delta.context === selfContext

    function mapToNmea(encoder, throttle) {
      const selfStreams = encoder.keys.map((key, index) => {
        let stream = app.streambundle.getSelfStream(key)
        if (encoder.defaults && typeof encoder.defaults[index] != 'undefined') {
          stream = stream.toProperty(encoder.defaults[index])
        }
        return stream
      }, app.streambundle)
      const sentenceEvent = encoder.sentence
        ? `g${encoder.sentence}`
        : undefined

      let stream = combineStreamsWith(selfStreams, function () {
        try {
          return encoder.f.apply(this, arguments)
        } catch (e) {
          console.error(e.message)
        }
      })
        .filter((v) => typeof v !== 'undefined')
        .changes()
        .debounceImmediate(20)

      if (throttle) {
        stream = stream.throttle(throttle)
      }

      plugin.unsubscribes.push(
        stream.onValue((nmeaString) => {
          if (app.reportOutputMessages) {
            app.reportOutputMessages(1)
          }
          app.emit('nmea0183out', nmeaString)
          if (sentenceEvent) {
            app.emit(sentenceEvent, nmeaString)
          }
          app.debug(nmeaString)
        })
      )
    }

    Object.keys(plugin.sentences).forEach((name) => {
      if (options[name]) {
        mapToNmea(plugin.sentences[name], options[getThrottlePropname(name)])
      }
    })
  }

  plugin.stop = function () {
    plugin.unsubscribes.forEach((f) => f())
  }

  plugin.sentences = loadSentences(app, plugin)
  buildSchemaFromSentences(plugin)
  return plugin
}

function buildSchemaFromSentences(plugin) {
  Object.keys(plugin.sentences).forEach((key) => {
    var sentence = plugin.sentences[key]
    const throttlePropname = getThrottlePropname(key)
    plugin.schema.properties[key] = {
      title: sentence['title'],
      type: 'boolean',
      default: false
    }
    plugin.schema.properties[throttlePropname] = {
      title: `${key} throttle ms`,
      type: 'number',
      default: 0
    }
  })
}

function loadSentences(app, plugin) {
  const fpath = path.join(__dirname, 'sentences')
  return fs
    .readdirSync(fpath)
    .filter((filename) => filename.endsWith('.js'))
    .reduce((acc, fname) => {
      let sentence = path.basename(fname, '.js')
      acc[sentence] = require(path.join(fpath, sentence))(app, plugin)
      return acc
    }, {})
}

const getThrottlePropname = (key) => `${key}_throttle`
