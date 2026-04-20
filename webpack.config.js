// Builds the React configuration panel that signalk-plugin-configurator
// loads over Module Federation. The plugin itself is a plain CJS module
// compiled by tsc (see `tsconfig.build.json`); webpack is only involved
// for the browser-side UI bundle, hence the split output directory
// (`dist/` for the Node plugin, `public/` for the browser asset).
const path = require('path')
const { ModuleFederationPlugin } = require('webpack').container
const packageJson = require('./package.json')

const sharedName = packageJson.name.replace(/[-@/]/g, '_')

module.exports = {
  entry: './src/configpanel/index.ts',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'public'),
    clean: false
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          // The bundle needs ESM + bundler-resolution and JSX support;
          // the root tsconfig is geared toward the CJS plugin build.
          // A sibling tsconfig under `src/configpanel/` flips the
          // relevant knobs without polluting the main settings.
          configFile: path.resolve(__dirname, 'src/configpanel/tsconfig.json'),
          transpileOnly: false
        }
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new ModuleFederationPlugin({
      name: sharedName,
      library: { type: 'var', name: sharedName },
      filename: 'remoteEntry.js',
      exposes: {
        './PluginConfigurationPanel':
          './src/configpanel/PluginConfigurationPanel'
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19' },
        'react-dom': { singleton: true, requiredVersion: '^19' }
      }
    })
  ]
}
