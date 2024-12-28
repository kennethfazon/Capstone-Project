module.exports = {
    resolve: {
      extensions: ['.js', '.jsx', '.json', '.css'],
      alias: {
        'mapbox-gl': require.resolve('mapbox-gl')
      }
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    }
  };
  