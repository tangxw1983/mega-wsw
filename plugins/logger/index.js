exports.write = function(cb, p) {
	var config = require('./config.js');
	var fs = require('fs');
	var logFile = config.logPath + '/' + p.prefix + '-' + (new Date()).pattern("yyyyMMdd") + '.log';
	fs.appendFile(
		logFile, 
		(new Date()).pattern("hhmmss - ") + p.content + "\n",
		function(err) {
			cb(err);
		}
	);
};

exports.log = function(text, prefix) {
	var fs = require('fs');
	var logFile = require('./config.js').logPath + '/' + (prefix || "log") + '-' + (new Date()).pattern("yyyyMMdd") + '.log';
	fs.appendFile(logFile, (new Date()).pattern("hhmmss - ") + text + "\n", function(err) {
		if (!!err) console.log("log failed", err);
	});
};

