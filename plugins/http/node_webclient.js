/* Usage
var wc = require('webclient');
var wc = require('./webclient.js');

var opt = url.parse("http://www.baidu.com/");
//var opt = {
//  hostname: 'www.baidu.com',
//  //port: 443,
//  port: 80,
//  path: '/',
//  method: 'GET'
//};
//opt.headers = {
//'user-agent': 'Safari'
//};
//opt.method = 'HEAD';
//
//cookies_pack,cookies_sub,cookies_add
wc.httpRequest(opt,function(o){
	_d_(o);
});

 */
var http = require('http');
var https = require('https');
var url = require('url');

var mg_core=require("mega-common").core;
var s2o=mg_core.s2o;
var o2s=mg_core.o2s;
var zlib = require('zlib');
var cfg = require('./config');
//TODO
//baseRequest 待解决:
//  cookie
//  multipart/form-data
//  referer
//  ...

var querystring = require("querystring");

function cookie_o2s(o){
	querystring.escape=function(o){return o;}
	return querystring.stringify(o,';');
}
function cookie_s2o(s){
	var rt={};
	if(s && s!=""){
		/*
		querystring.escape=function(o){return o;}
		querystring.unescape=function(o){return o;}
		rt=querystring.parse(s, ';', '=');
		*/
		s.split(';').forEach(function(ss){
			var parts = ss.split('=');
			//rt[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
			rt[ parts.shift().trim() ] = parts.join('=').trim();
		});
	}
	return rt;
}

function getDomain(hostName){
	//var hostName = getHostName(url);
	var domain = hostName;
	if (hostName != null) {
		var parts = hostName.split('.').reverse();

		if (parts != null && parts.length > 1) {
			domain = parts[1] + '.' + parts[0];

			if (hostName.toLowerCase().indexOf('.co.uk') != -1
			&& parts.length > 2) {
				domain = parts[2] + '.' + domain;
			}
		}
	}
	return domain;
}
//把第2个数组遇key同覆盖去第1个
function merge(set1, set2){
	for (var key in set2){
		if (set2.hasOwnProperty(key))
			set1[key] = set2[key];
	}
	return set1;
}

//// Create set from array
//function setify(array){
//  var result = {}
//  for (var item in array){
//    if (array.hasOwnProperty(item))
//      result[array[item]] = true
//  }
//  return result
//}

var _g_tmp_cookie_a={};
var fs = require('fs');
function loadCookieFromFile(fn){
	//_d_("loadCookieFromFile",_g_tmp_cookie_a);
	var rt={};
	try{
	//rt= s2o(fs.readFileSync('./tmp/'+fn+".txt",'utf-8'));//这里同步是无奈之举，会损失nodejs性能啊！
		rt= s2o(fs.readFileSync(cfg.keyPath+'/'+fn+".txt",'utf-8'));//这里同步是无奈之举，会损失nodejs性能啊！
	}catch(ex){}
	//fs.readFile('./tmp/'+fn,function(err,data){
	//});
	return rt;
	//return _g_tmp_cookie_a[fn];//tmp in mem
	//return {};
}
function saveCookieToFile(fn,ck){
	//_d_("saveCookieToFile",_g_tmp_cookie_a);
	//tmp
	var to_save=(typeof(ck)=="string")? cookie_s2o(ck) : ck;
	_g_tmp_cookie_a[fn]=to_save;
	try{
	//return fs.writeFileSync('./tmp/'+fn+".txt",o2s(to_save),'utf-8');//这里同步是无奈之举，会损失nodejs性能啊！
		return fs.writeFileSync(cfg.keyPath+"/"+fn+".txt",o2s(to_save),'utf-8');//这里同步是无奈之举，会损失nodejs性能啊！
	}catch(ex){return false;}
	return true;
}
function baseRequest(opt_req, cb) {
    var timer = null;
    var tm0 = (new Date()).getTime();
    //var _d_=console.log;

    var opt = {};
    if (typeof opt_req === 'string') {
        opt = url.parse(opt_req);
    }
    else opt = opt_req;

    var module = (opt.protocol === 'https:') ? https : http;

    if (!opt.headers) opt.headers = {};

    var _default_user_agent = "Mozilla/5.0 (Windows NT 5.2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.19 Safari/537.36";
    var _user_agent = opt['user-agent'] || _default_user_agent;
    opt.headers['user-agent'] = _user_agent;

    ////////////////////////////////////////////////// cookie {
    var cookies_pack = opt.cookies_pack || "default";//注意如果是default，有可能会串号的，所以特别留意！
    var cookies_pack_a = {};
    if (!opt.resetCookie) {
        //_d_("use previous cookies");
        if (opt.cookies_data)
            cookies_pack_a = s2o(opt.cookies_data);
        else
            cookies_pack_a = loadCookieFromFile(cookies_pack) || {};
    }
    var _hostname = opt.hostname;
    if (!_hostname) throw new Error("need hostname...");//不会出现的check
    var _domain = getDomain(_hostname);
    var req_cookie_a = cookies_pack_a[_domain] || {};

    //传进来的opt有可能会有这个[Cookie](string类型)
    if (opt.headers['Cookie']) {
        var req_cookies_s = opt.headers['Cookie'];
        //if(req_cookies_s && req_cookies_s!=""){
        req_cookie_a = merge(req_cookie_a, cookie_s2o(req_cookies_s));
        //}
    }

    if (opt.cookies_full) {//full replace
        var cookies_full = opt.cookies_full;
        req_cookie_a = (cookies_full);
    }
    if (opt.cookies_full_s) {//full replace
        var cookies_full_s = opt.cookies_full_s;
        req_cookie_a = cookie_s2o(cookies_full_s);
    }
    if (opt.cookies_add) {//insert&update
        var cookies_add = opt.cookies_add;
        req_cookie_a = merge(req_cookie_a, cookies_add);
    }
    //TODO cookies_sub 减,cookies_clean,清

    var req_cookie_s = cookie_o2s(req_cookie_a);
    opt.headers['Cookie'] = req_cookie_s;
    //_d_("req_cookie_s",req_cookie_s);
    cookies_pack_a[_domain] = req_cookie_a;
    //_d_("req_cookie_a",req_cookie_a);
    saveCookieToFile(cookies_pack, cookies_pack_a);

    ////////////////////////////////////////////////// cookie }

    var post_s = opt.post_s;
    if (post_s) {
        opt.method = 'POST';
    }
    var referer_s = opt.referer_s;
    if (referer_s) {
        opt.headers['Referer'] = referer_s;
    }
    if (post_s) {
        //opt.headers['Content-Type']="application/x-www-form-urlencoded; charset=UTF-8";
        opt.headers['Content-Type'] = "application/x-www-form-urlencoded";
        opt.headers['Content-Length'] = post_s.length;
    }
    //TODO
    var _accept_language = opt['Accept-Language'] || "zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4";
    opt.headers['Accept-Language'] = _accept_language;
    //opt.headers['Accept-Language']="zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4";

    //opt.headers['Accept']="application/json, text/javascript, */*; q=0.01";

    //TODO
    var _accept_encoding = opt['Accept-Encoding'] || "gzip";
    opt.headers['Accept-Encoding'] = _accept_encoding;
    //opt.headers['Accept-Encoding']="gzip,deflate,sdch";

    //opt.headers['X-Requested-With']="XMLHttpRequest";
    //opt.headers['Host']="www.fun88.com";
    //opt.headers['Origin']="http://www.angel88ball.com";
    //opt.headers['Referer']="http://www.angel88ball.com/zh-CN/Index";

    opt.headers['Accept'] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"; //TODO 针对其他网要customize
    //opt.headers['Cookie']="ASP.NET_SessionId=+oaICbnVzvSRmkdwZSOFZpXAAAAdUdCh7JJMTA3Njk2NixQTEFZRVIsOQ==";

//	_d_("opt",opt);//DEBUG

    var tm1 = (new Date()).getTime();

    var rt = {};
    console.log("begin request", opt);
    var req = module.request(opt, function (resp) {
        console.log("on response");

        if (timer) clearTimeout(timer);
        //_d_("resp back", (new Date()).getTime()-tm1);
        rt['nettime1'] = (new Date()).getTime() - tm1;

        var statusCode = resp.statusCode;

        var _tmp_s = "";
//    var _tmp_arr = new Array();
        var _tmp_arr = [], len = 0;
        resp.on('data', function (d) {
            console.log("on data");
//      var newd=new Buffer(d).toString("base64");
//      fs.appendFile("./test.txt",new Buffer(newd,"base64"));
            _tmp_arr.push(d);
//      len+= d.length;
//     _tmp_arr.push(newd);
            _tmp_s += d;
        });

        rt['tm0'] = tm0;
        rt['statusCode'] = statusCode;
        var headers = resp.headers || {};
        rt['headers'] = headers;

        ///////////////////////////////////////////////////////// cookie {
        var cookie_s_in_header = headers['Cookie'] || "";
        var headers_set_cookie_a = resp.headers['set-cookie'];//注意它是个数组...
        var cookies_pack_a = loadCookieFromFile(cookies_pack) || {};
        var _Cookies = cookies_pack_a[_domain] || {};
        if (headers_set_cookie_a) {
            var f_update = false;
            headers_set_cookie_a.forEach(function (headers_set_cookie) {
                _Cookies = merge(_Cookies, cookie_s2o(headers_set_cookie));
                f_update = true;
            });
            if (f_update) {
                rt['cookies'] = _Cookies;
                cookies_pack_a[_domain] = _Cookies;
                saveCookieToFile(cookies_pack,cookies_pack_a);
                rt['cookies_data'] = o2s(cookies_pack_a);
            }
        }
        ///////////////////////////////////////////////////////// cookie }

        rt['options'] = opt;
        rt['opt'] = opt;
        rt['req_cookie'] = req_cookie_a;//提交的cookie
        rt['req_cookie_s'] = req_cookie_s;//提交的cookie string

        var encrypt = opt.encrypt;//处理encrypt

        resp.on('end', function () {
            console.log("on end");
            // _d_("headers",resp.headers)
            var encoding = resp.headers['content-encoding']; //added by zyq 20150511
            var tm = (new Date()).getTime();
            rt['nettime2'] = tm - tm1;
            var test;
            var _output = "";
            //_d_("encoding", encoding);
            if (encoding == 'gzip') {
                _output = Buffer.concat(_tmp_arr);
                zlib.gunzip(_output, function (err, decoded) {
                    _output = decoded && decoded.toString();
                    //_d_("_output",_output);
                    rt['body'] = _output;
                    rt['headers'] = resp.headers;
                    rt['exectime'] = tm - tm0;
                    if (cb) cb(rt);
                });
            } else if (encoding == 'deflate') {
                _output = Buffer.concat(_tmp_arr);
                zlib.inflate(_output, function (err, decoded) {
                    //_d_("decoded",decoded && decoded.toString());
                    //_d_("decoded err",err);
                    //_d_("_output",_output);
                    _output = decoded && decoded.toString();
                    rt['body'] = _output;
                    rt['headers'] = resp.headers;
                    rt['exectime'] = tm - tm0;
                    if (cb) cb(rt);
                });
            } else {
                if (_tmp_s && _tmp_s != "") {
//       rt['body']= _tmp_arr.join();
//				rt['body']=_tmp_s;
                    if (encrypt == 'base64')
                        _output = Buffer.concat(_tmp_arr).toString('base64');
                    else {
                        _output = Buffer.concat(_tmp_arr).toString();
                        if (opt.compress) {
                            _output = _output.replace(/[\r\n]/g, "");
                        }
                    }

                    if (opt.gzip) test = Buffer.concat(_tmp_arr);//todo:需要完善，返回以后没有解压，需要想方法解压


                    rt['body'] = _output;
//        rt['body']=_output.length<=1024?_output:_output.substring(0,1024);
                } else {
                }
                //rt['headers']=headers;

                if (opt.gzip) {
                    zlib.gzip(test, function (err, newData) {
                        _output = newData.toString('base64');
                        rt['body'] = _output;
                        rt['headers'] = resp.headers;
                        rt['exectime'] = tm - tm0;
                        if (cb)cb(rt);
                    });
                } else {
                    rt['headers'] = resp.headers;
                    rt['exectime'] = tm - tm0;
                    if (cb)cb(rt);

                }
            }
        });
        resp.on('error', function (e) {
            var tm = (new Date()).getTime();
            rt['body'] = _tmp_s;
            rt['exectime'] = tm - tm0;
            rt['err'] = e;
            if (cb) cb(rt);
        });
    });
    req.on('error', function (ex) {
        if (timer) clearTimeout(timer);
        //_d_("error:",ex);
        var tm = (new Date()).getTime();
        rt['exectime'] = tm - tm0;
        rt['err'] = ex.message;
        if (cb) cb(rt);
    });
    if (post_s) {
        //_d_("post_s",post_s);
        //req.write(post_s +"\n")
        req.write(post_s)
    }
    req.end();
    //_d_("req sent");

    timer = setTimeout(function () {
        req.abort();
        //_d_('Request Timeout.');
    }, 30000);
}
exports.baseRequest = baseRequest;//直接...

//DOC
/* 参考的其它，不过后来没有用到:
npm install request
http://blog.segmentfault.com/younglaker/1190000000385867
https://github.com/mikeal/request
*/

