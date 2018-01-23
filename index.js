const Bacon = require('baconjs')
const {
  toSentence,
  computeChecksum,
  toHexString,
  radsToDeg,
  padd,
  toNmeaDegrees
} = require('./nmea')
const path = require('path')
const fs = require('fs')

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
      'If there is SK data for the conversion generate the following NMEA0183 sentences from Signal K data:',
    properties: {}
  }

  plugin.start = function (options) {
    const selfContext = 'vessels.' + app.selfId
    const selfMatcher = delta => delta.context && delta.context === selfContext

    function mapToNmea (encoder) {
      const selfStreams = encoder.keys.map((key, index) => {
        let stream = app.streambundle.getSelfStream(key)
        if (encoder.defaults && typeof encoder.defaults[index] != 'undefined') {
          stream = stream.merge(Bacon.once(encoder.defaults[index]))
        }
        return stream
      }, app.streambundle)
      plugin.unsubscribes.push(
        Bacon.combineWith(encoder.f, selfStreams)
          .changes()
          .debounceImmediate(20)
          .onValue(nmeaString => {
            app.emit('nmea0183out', nmeaString)
          })
      )
    }

    Object.keys(plugin.sentences).forEach(name => {
      if (options[name]) {
        mapToNmea(plugin.sentences[name])
      }
    })
  }

  plugin.stop = function () {
    plugin.unsubscribes.forEach(f => f())
  }

  plugin.sentences = loadSentences(app, plugin)
  console.log(plugin.sentences)
  buildSchemaFromSentences(plugin)
  return plugin
}

function buildSchemaFromSentences (plugin) {
  Object.keys(plugin.sentences).forEach(key => {
    var sentence = plugin.sentences[key]
    plugin.schema.properties[key] = {
      title: sentence['title'],
      type: 'boolean',
      default: false
    }
  })
}

function loadSentences (app, plugin) {
  const fpath = path.join(__dirname, 'sentences')
  return fs
    .readdirSync(fpath)
    .filter(filename => filename.endsWith('.js'))
    .reduce((acc, fname) => {
      let sentence = path.basename(fname, '.js')
      acc[sentence] = require(path.join(fpath, sentence))(app, plugin)
      return acc
    }, {})
}
