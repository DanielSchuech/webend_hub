var webpack = require('webpack');

module.exports = {
  devtool: 'source-map',
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  },
  ts: {
    configFileName: 'tsconfig.webpack.json'
  },
  plugins: [
    // new webpack.optimize.UglifyJsPlugin({
    //   sourceMap: false,
    //   mangle: false
    // })
  ]
}