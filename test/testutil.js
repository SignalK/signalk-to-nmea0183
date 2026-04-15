const Bacon = require('baconjs')

module.exports = {
  createAppWithPlugin: function (onEmit, enabledConversion) {
    const streams = {}
    const app = {
      streambundle: {
        getSelfStream: (path) => {
          if (streams[path]) {
            return streams[path]
          } else {
            return (streams[path] = new Bacon.Bus())
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
    // enabledConversion can be a sentence-name string (legacy form) or a
    // full options object so callers can also set throttle keys etc.
    const options =
      typeof enabledConversion === 'string'
        ? { [enabledConversion]: true }
        : enabledConversion
    plugin.start(options)
    return app
  }
}
