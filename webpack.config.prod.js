const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const webpack = require("webpack");

module.exports = {
	mode: "production",
	entry: './src/index.jsx',
	devtool: "source-map",
	devServer: {
		contentBase: "./dist"
	},
	 optimization: {
    minimizer: [
      new TerserPlugin({
    parallel: true,
    terserOptions: {
      ecma: 6,
    },
  }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
	plugins: [
		new CleanWebpackPlugin(["dist"]),
		new HtmlWebpackPlugin({
			template: "./index.html",
			filename: "index.html",
			inject: "body",
			favicon: 'src/favicon.ico'
		}),
		new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
		new webpack.ProvidePlugin({
	        //$: "jquery",
	        //jQuery: "jquery",
	        //_: "lodash",
	        cloudy: "cloudinary-core"
    	}),
    	new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
	],
	output: {
		path: path.resolve(__dirname, './dist'),
		filename: 'bundle.js',
	},
	module: {
		rules: [
		      {
			test: /\.jsx$/,
			exclude: /(node_modules)/,
			use: {
				loader: 'babel-loader',
		        options: {
			      'plugins': ['lodash'],
			      'presets': [['@babel/env', { 'targets': { 'node': 6 } }]]
			    }
			}
		}, {
			test: /\.js$/,
			exclude: /(node_modules)/,
			use: {
				loader: 'babel-loader',
		        options: {
		      'plugins': ['lodash'],
		      'presets': [['@babel/env', { 'targets': { 'node': 6 } }]]
		    }
			}
		}, {
			test: /\.css$/,
			use: [MiniCssExtractPlugin.loader,
          'css-loader']
		},
        {
            test: /\.(png|jp(e*)g|svg)$/,  
			exclude: /(node_modules)/,
            use: [{
                loader: 'url-loader',
                options: { 
                    limit: 8000, // Convert images < 8kb to base64 strings
                    name: 'img/[name].[ext]'
                } 
            }]
		}
]
	}
};