var querystring = require("querystring");

var mg_core=require("mega-common").core;
var s2o=mg_core.s2o;
var o2s=mg_core.o2s;

exports.request = function(cb, p, d, k) {
    if (typeof p == "string") p = s2o(p);

	var wc = require('./node_webclient.js');
	var url=require("url");
	var u=p.u;
	if(u){
		var opt = url.parse(u);

        opt['cookies_data'] = d;
        opt['cookies_pack'] = k;

		var cookies_pack=p.cookies_pack;
		if(cookies_pack){
			opt['cookies_pack']=cookies_pack;
		}

		var cookies_full_s=p.cookies_full_s;
		if(cookies_full_s){
			opt['cookies_full_s']=cookies_full_s;
		}

		var cookies_full=p.cookies_full;
		if(cookies_full){
			opt['cookies_full']=cookies_full;
		}

		var cookies_add=p.cookies_add;
		if(cookies_add){
			opt['cookies_add']=cookies_add;
		}

		var user_agent=p['user-agent'];
		if(user_agent){
			opt['user-agent']=user_agent;
		}
		
		var accept_encoding=p['Accept-Encoding'];
		if(accept_encoding){
			opt['Accept-Encoding']=accept_encoding;
		}
		
		var post=p.post;
		if(post){
			opt['post_s']=querystring.stringify(post,'&','=');
		}
		var post_s=p.post_s;
		if(post_s){
			opt['post_s']=post_s;
		}

		var referer=p.referer;
		if(referer){
			opt['referer_s']=referer;
		}

		//判断使用什么方式encrypt 返回的body, 默认不encrypt
		var encrypt =p.encrypt;
		if(encrypt){
			opt['encrypt']=encrypt;
		}

		var gzipflag = p.gzip;
		if(gzipflag){
			opt['gzip']=gzipflag;
		}

		var compress = p.compress;
		if(compress){
			opt['compress']=compress;
		}

		var resetCookie = p.resetCookie;
		if(resetCookie){
			opt['resetCookie'] = resetCookie;
		}

		wc.baseRequest(opt,function(o){
			require('../logger/index.js').log(u + o2s({exectime:o.exectime,nettime1:o.nettime1,nettime2:o.nettime2,err:o.err}), "web-time");

			require('../logger/index.js').log(o2s(o), "web-time");
			if(o.err){
				cb(o.err);
			}else{
				cb(null,{body:o.body,cookies:o.cookies,exectime:o.exectime,headers:o.headers,_d:o.cookies_data});
			}
		});//baseRequest
	}else{
		cb("empty .u");
	}		
};

exports.exec = function(_req, cb) {
    var wc = require('./node_webclient.js');
    var url=require("url");
    var u=_req.u;
    if(u){
        var opt = url.parse(u);

        var cookies_data=_req.cookies_data;
        if(cookies_data){
            opt['cookies_data']=cookies_data;
        }

        var cookies_pack=_req.cookies_pack;
        if(cookies_pack){
            opt['cookies_pack']=cookies_pack;
        }

        var cookies_full_s=_req.cookies_full_s;
        if(cookies_full_s){
            opt['cookies_full_s']=cookies_full_s;
        }

        var cookies_full=_req.cookies_full;
        if(cookies_full){
            opt['cookies_full']=cookies_full;
        }

        var cookies_add=_req.cookies_add;
        if(cookies_add){
            opt['cookies_add']=cookies_add;
        }

        var user_agent=_req['user-agent'];
        if(user_agent){
            opt['user-agent']=user_agent;
        }

        var accept_encoding=_req['Accept-Encoding'];
        if(accept_encoding){
            opt['Accept-Encoding']=accept_encoding;
        }

        var post=_req.post;
        if(post){
            opt['post_s']=querystring.stringify(post,'&','=');
        }
        var post_s=_req.post_s;
        if(post_s){
            opt['post_s']=post_s;
        }

        var referer=_req.referer;
        if(referer){
            opt['referer_s']=referer;
        }

        //判断使用什么方式encrypt 返回的body, 默认不encrypt
        var encrypt =_req.encrypt;
        if(encrypt){
            opt['encrypt']=encrypt;
        }

        var gzipflag = _req.gzip;
        if(gzipflag){
            opt['gzip']=gzipflag;
        }

        var compress = _req.compress;
        if(compress){
            opt['compress']=compress;
        }

        var resetCookie = _req.resetCookie;
        if(resetCookie){
            opt['resetCookie'] = resetCookie;
        }

        wc.baseRequest(opt,function(o){
            require('../logger/index.js').log(u + o2s({exectime:o.exectime,nettime1:o.nettime1,nettime2:o.nettime2,err:o.err}), "web-time");
            //require('../logger/index.js').log(o2s(o), "web-time");
            if(o.err){
                cb(o.err);
            }else{
                cb(null,{body:o.body,cookies:o.cookies,exectime:o.exectime,headers:o.headers,_d:o.cookies_data});
            }
        });//baseRequest
    }else{
        cb("empty .u");
        WorkerReply(conn,_token,
            {sts:"KO",msg:"empty .u"}
        );
    }
};
