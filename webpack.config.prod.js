const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin")
const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require("webpack");

module.exports = {
	mode: "production",
	entry: './src/index.jsx',
	devtool: "source-map",
	/*
	devServer: {
		contentBase: "./dist"
	},
	*/
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
			inject: "body"
		}),
		new MiniCssExtractPlugin({
	      filename: "[name].css",
	      chunkFilename: "[id].css"
	    }),
		new CopyWebpackPlugin([{
			from:'src/scenarios/**/assets/**/*',
			to:'assets',
			flatten: true
		}])
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
			exclude: [/(node_modules)\//, /fav\//],
            use: [{
                loader: 'url-loader',
                options: { 
                    limit: 8000, // Convert images < 8kb to base64 strings
                    name: 'img/[name].[ext]'
                } 
            }]
		}, 
        {
            test: /^fav\/(.*)\.(png|ico|xml)$/,  
			exclude: /(node_modules)\//,
            use: [{
                loader: 'url-loader',
                options: { 
                    limit: 16000, // Convert images < 8kb to base64 strings
                    name: 'fav/[name].[ext]'
                } 
            }]
		}
		]
	}
};