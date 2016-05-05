module.exports = {  
  entry: './src/app/main.ts',
  output: {
    filename: 'build/app/bundle.js'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
  },
  module: {
    loaders: [
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ]
  },
  externals: {
    '@angular/core': `window.webend['@angular/core']`,
    '@angular/platform-browser-dynamic': `window.webend['@angular/platform-browser-dynamic']`   
  },
  ts: {
    configFileName: 'tsconfig.webpack.json'
  }
}