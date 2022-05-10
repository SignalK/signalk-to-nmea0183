const Bacon = require('baconjs')

module.exports = {
  createAppWithPlugin: function (onEmit, enabledConversion) {
    const streams = {
    }
    const app = {
      streambundle: {
        getSelfStream: path => {
          if (streams[path]) {
            return streams[path]
          } else {
            return streams[path] = new Bacon.Bus()
          }
        }
      },
      emit: (name, value) => {
        if (name === 'nmea0183out') {
          onEmit(name, value)
        }
      },
      debug: (msg) => console.log(msg)
    }
    const plugin = require('../')(app)
    const options = {}
    options[enabledConversion] = true
    plugin.start(options)
    return app
  }
}
