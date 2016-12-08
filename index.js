'use strict';

var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var request = require('request');
var PluginError = gutil.PluginError;
var colors = gutil.colors;

var PLUGIN_NAME = 'gulp-upload-manifest';
var plugin = function(options) {
	if(!options) {
		throw new PluginError(PLUGIN_NAME, "options needed");
	}
	if(!options.url) {
		throw new PluginError(PLUGIN_NAME, "options.url needed");
	}
	options.formData = options.formData || {};
	// if(!options.formData) {
	// 	throw new PluginError(PLUGIN_NAME, "options.formData needed");
	// }
	if(!options.uploadName && typeof(options.uploadName == "string")) {
		throw new PluginError(PLUGIN_NAME, "options.uploadName needed and must be string");
	}
	if(!options.rspFun && typeof(options.rspFun == "function")){
		throw new PluginError(PLUGIN_NAME, "options.rspFun needed and must be function");
	}

	var manifest = {};
	return through.obj(function(file, enc, cb){
		if (file.isNull()) {
			cb(null, file);
			return;
		}
		if (file.isStream()) {
			cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
			return;
		}

		var obj = {};
		obj[options.uploadName] = fs.createReadStream(file.path);
		var formData = Object.assign({}, options.formData, obj);
		// 上传文件之后的回调
		function uploadRst(err, res, body){
			if(err){
				gutil.log(err);
				cb(err, null);
			} else {
				var originPath = path.relative(file.base, file.path);
				var remoteUrl = options.rspFun(body);
				if(remoteUrl){
					gutil.log('Success', colors.green(originPath), '==>', colors.green(remoteUrl));
					manifest[originPath] = remoteUrl;
					cb();
				}else{
					gutil.log('Error', colors.red(originPath));
					cb('request failed', null)
				}
			}
		}
		uploadFile(options.url, formData, uploadRst);
	}, function(cb) {
		if (Object.keys(manifest).length === 0) {
			cb();
			return;
		}

		var manifestFile = new gutil.File({
			path: 'upload-manifest.json',
			contents: new Buffer(JSON.stringify(manifest, '\n', 4)),
		})
		this.push(manifestFile);
		cb();
	})
	
}
// 上传文件
function uploadFile(url, formData, cb) {
	request.post({
		url: url,
		method: 'POST',
		json: true,
		formData: formData,
	}, cb)
}

module.exports = plugin;