// 考虑采用bearcat实现

var mg_core=require("mega-common").core;
var mg_ws=require("mega-common").ws;
var WS_Request=mg_ws.WS_Request;

var downloaded_plugins = {};

function getModule(req, conn, callback) {
    try {
        if (req._c == "worker") {
            callback(null, exports);
        } else {
            callback(null, require("./plugins/" + req._c + "/index.js"));
        }
    } catch (ex) {
        if (downloaded_plugins[req._c]) {
            // 内存中如果已经安装，直接返回
            // 如果有更新，wss发来通知时将会删除已安装版本，下次用到时，将重新从wss下载
            callback(null, downloaded_plugins[req._c]);
        } else {
            // 从wss下载最新的plugin
            WS_Request(conn,{
                _c: "plugin",
                _m: "download",
                _p: req._c
            },function(rto) {
                if (rto.STS == "OK") {
                    try {
                        downloaded_plugins[req._c] = eval("(function(){var module=this;var exports=this.exports={};" + rto.data.code + ";return this;})().exports;");
                        callback(null, downloaded_plugins[req._c]);
                    } catch (e) {
                        callback("install plugin [" + req._c + "] failed - " + e.message);
                    }
                } else {
                    callback("download plugin [" + req._c + "] failed -" + rto.MSG);
                }
            });
        }
    }
}

function deprecatePlugin(callback, pluginName) {
    if (downloaded_plugins[pluginName]) {
        downloaded_plugins[pluginName] = null;
    }
    callback();
}

function run(req,conn,callback) {
    getModule(req,conn,function(err,module) {
        if (!!err) {
            callback({STS: "KO", data: {errmsg: err}});
        } else {
            var func = module[req._m];
            if (!func) {
                callback({STS: "KO", data: {errmsg: "_m "+req._c+"."+req._m+" TODO"}});
            } else {
                mg_core.asyncDo(function(cb){
                    func(cb, req._p, req._d, req.user_key);
                }, function(err,data){
                    callback(mg_core.formatResponse(err,data));
                });
            }
        }
    });
}

if(typeof(exports)!="undefined"){
    exports.run = run;
    exports.deprecatePlugin = deprecatePlugin;
}