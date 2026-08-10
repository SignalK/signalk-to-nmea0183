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
        loader: 'esbuild-loader',
        exclude: /node_modules/,
        options: {
          // esbuild transpiles without type checking; `npm run typecheck`
          // is the type gate and covers `src/**/*`, this panel included.
          // A loader that drives the TypeScript compiler API is not an
          // option: the `typescript` package stopped exporting one in v7.
          // A sibling tsconfig under `src/configpanel/` supplies the JSX
          // transform and the ESM + bundler-resolution the browser bundle
          // needs, without polluting the CJS plugin build.
          tsconfig: path.resolve(__dirname, 'src/configpanel/tsconfig.json'),
          // esbuild takes its output target from here, not from the
          // tsconfig; keep the two in sync.
          target: 'es2022'
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
