var mg_core=require("mega-common").core;
var s2o=mg_core.s2o;
var o2s=mg_core.o2s;

/*
 * codeType 列表：
1.纯数字
1000 	任意长度数字 	每一位2.5点数 	每一位3点数 	90秒 	会降低识别率轻易不要选择这个类型
1010 	1位纯数字 	10点数 	12点数 	60秒 	
1020 	2位纯数字 	10点数 	12点数 	60秒 	
1030 	3位纯数字 	10点数 	12点数 	60秒 	
1040 	4位纯数字 	10点数 	12点数 	60秒 	
1050 	5位纯数字 	12点数 	14.4点数 	60秒 	
1060 	6位纯数字 	15点数 	18点数 	60秒 	
1070 	7位纯数字 	17点数 	20.4点数 	60秒 	
1080 	8位纯数字 	20点数 	24点数 	60秒 	
1090 	9位纯数字 	22点数 	26.4点数 	60秒 	
2.纯英文
2000 	任意长度字母 	每一位2.5点数 	每一位3点数 	90秒 	会降低识别率轻易不要选择这个类型
2010 	1位纯字母 	10点数 	12点数 	60秒 	
2020 	2位纯字母 	10点数 	12点数 	60秒 	
2030 	3位纯字母 	10点数 	12点数 	60秒 	
2040 	4位纯字母 	10点数 	12点数 	60秒 	
2050 	5位纯字母 	12点数 	14.4点数 	60秒 	
2060 	6位纯字母 	15点数 	18点数 	60秒 	
2070 	7位纯字母 	17点数 	20.4点数 	60秒 	
2080 	8位纯字母 	20点数 	24点数 	60秒 	
2090 	9位纯字母 	22点数 	26.4点数 	60秒 	
2100 	10位纯字母 	25点数 	30点数 	60秒 	
3.英文数字混合
3000 	任意长度英数混合 	每一位2.5点数 	每一位3点数 	90秒 	会降低识别率轻易不要选择这个类型
3010 	1位英数混合 	10点数 	12点数 	60秒 	
3020 	2位英数混合 	10点数 	12点数 	60秒 	
3030 	3位英数混合 	10点数 	12点数 	60秒 	
3040 	4位英数混合 	10点数 	12点数 	60秒 	
3050 	5位英数混合 	12点数 	14.4点数 	60秒 	
3060 	6位英数混合 	15点数 	18点数 	60秒 	
3070 	7位英数混合 	17点数 	20.4点数 	60秒 	
3080 	8位英数混合 	20点数 	24点数 	60秒 	
3090 	9位英数混合 	22点数 	26.4点数 	60秒 	
3100 	10位英数混合 	25点数 	30点数 	60秒 	
4.纯汉字
4000 	任意长度汉字 	每一位10点数 	每一位12点数 	90秒 	会降低识别率轻易不要选择这个类型
4010 	1位汉字 	10点数 	12点数 	90秒 	
4020 	2位汉字 	20点数 	24点数 	90秒 	
4030 	3位汉字 	30点数 	36点数 	90秒 	
4040 	4位汉字 	40点数 	48点数 	90秒 	
4050 	5位汉字 	50点数 	60点数 	90秒 	
4060 	6位汉字 	60点数 	72点数 	90秒 	
4070 	7位汉字 	70点数 	84点数 	90秒 	
4080 	8位汉字 	80点数 	96点数 	90秒 	
4090 	9位汉字 	90点数 	108点数 	90秒 	
4100 	10位汉字 	100点数 	120点数 	90秒 	
5.数字英文汉字混合
5000 	任意长度中英数三混 	每一位英数2.5点数，中文10点数 	每一位英数3点数，中文12点数 	90秒 	会降低识别率轻易不要选择这个类型
*/

var defaultApiConfig = {
	// 'username': 'tangxw',
	// 'password': 'abcd0000',
	// 'softid': '26814',
	// 'softkey': 'f47de09b0f5a42b19c1dfb78e566debc'
	'username': 'wingkong1978',
	'password': 'qazWSX12',
	'softid': '37112',
	'softkey': 'b1ce6e3ae2a04c5e97e6edb7cbb0cd3a'
};

var recognition = function(callback, p) {
    var options;

    if (typeof p == "string")
        options = s2o(p);
    else
        options = p;


	if (!callback) throw new Error("No callback");

	if (!options) {
		callback("No options");
		return;
	}

	if (!options.image) {
		callback("No image");
		return;
	}

	var rest 	 = require('restler');
	
	if (!options.codeType) options.codeType = "3050";
	if (!options.apiConfig) options.apiConfig = defaultApiConfig;

	if (options.image.type == "url") {
		rest.post('http://api.ysdm.net/create.json', {
			multipart: true,
			data: {
				'username': options.apiConfig.username,
				'password': options.apiConfig.password,
				'typeid': options.codeType,
				'softid': options.apiConfig.softid,
				'softkey': options.apiConfig.softkey,
				'imageurl': options.image.url
			},
			headers: { 
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
				'Content-Type' : 'application/x-www-form-urlencoded' 
			}
		}).on('complete', function(data) {
			var captcha = JSON.parse(data);
			if (captcha["Result"])
				callback(null, captcha);
			else if (captcha["Error"])
				callback(captcha["Error"]);
			else
				callback("Unexpected api response");
		});		
	} else {
		var image;
		if (options.image.type == "base64") {
			if (!options.image.data) {
				callback("No image data");
				return;
			}
			if (!options.imageType) options.imageType = "jpg";
			image = rest.data("i." + options.imageType, 'image/' + options.imageType, new Buffer(options.image.data, 'base64'));
		} else if (options.image.type == "file") {
			if (!options.image.filename) {
				callback("No image filename");
				return;
			}
			if (!options.imageType) {
				var m = /\.(\w+)$/.exec(options.image.filename);
				if (m) {
					options.imageType = m[1];
				} else {
					options.imageType = "jpg";
				}
			}
			var fs = require('fs');
			image = rest.file(options.image.filename, null, fs.statSync(options.image.filename).size, null, 'image/' + options.imageType);
		} else {
			callback("Unknown image type");
			return;
		}

		rest.post('http://api.ysdm.net/create.json', {
			multipart: true,
			data: {
				'username': options.apiConfig.username,
				'password': options.apiConfig.password,
				'typeid': options.codeType,
				'softid': options.apiConfig.softid,
				'softkey': options.apiConfig.softkey,
				'image': image
			},
			headers: { 
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
				'Content-Type' : 'application/x-www-form-urlencoded' 
			}
		}).on('complete', function(data) {
			var captcha = JSON.parse(data);
			if (captcha["Result"])
				callback(null, captcha);
			else if (captcha["Error"])
				callback(captcha["Error"]);
			else
				callback("Unexpected api response");
		});
	}
}

var reporterror = function(callback, p) {
    var options;

    if (typeof p == "string")
        options = s2o(p);
    else
        options = p;

	if (!callback) callback = function() {};

	if (!options.id) {
		callback("Need recognition result id");
		return;
	}

	var rest 	 = require('restler');

	if (!options.apiConfig) options.apiConfig = defaultApiConfig;

	rest.post('http://api.ysdm.net/reporterror.json', {
		data: {
			'username': options.apiConfig.username,
			'password': options.apiConfig.password,
			'softid': options.apiConfig.softid,
			'softkey': options.apiConfig.softkey,
			'id': options.id
		},
		headers: { 
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
			'Content-Type' : 'application/x-www-form-urlencoded' 
		}
	}).on('complete', function(data) {
		callback(null, data);
	});
};

exports.recognition = recognition;
exports.reporterror = reporterror;
