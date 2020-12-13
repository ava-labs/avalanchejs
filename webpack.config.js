const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const gitRevisionPlugin = new GitRevisionPlugin();
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: {
    avalanche: './dist/index.js',
  },
  
  devServer: {
    contentBase: './dist'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    //filename: '[name]-[git-revision-version].js',
    filename: '[name].js',
    path: path.resolve(__dirname, 'web'),
    library: "avalanche",
    libraryTarget: "umd",
    umdNamedDefine: true
  },
  plugins: [
    gitRevisionPlugin,
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      'VERSION': JSON.stringify(gitRevisionPlugin.version()),
      'COMMITHASH': JSON.stringify(gitRevisionPlugin.commithash()),
      'BRANCH': JSON.stringify(gitRevisionPlugin.branch())
    }),
    new HtmlWebpackPlugin({
      title: "Caching",
    })
  ],
  optimization: {
    minimizer: [new TerserPlugin({
      terserOptions: {
        ecma: 2015,
        warnings: false,
        mangle: false,
        keep_classnames: true,
        keep_fnames: true
      },
    })],
  },
};
