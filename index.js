var _d_=console.log;

require("./plugins/biz/index.js");

var querystring = require("querystring");

var mg_core=require("mega-common").core;
var s2o=mg_core.s2o;
var o2s=mg_core.o2s;

var mg_ws=require("mega-common").ws;
var RpcController = require("./rpc_controller.js");
var WS_Send_Raw=mg_ws.WS_Send_Raw;
var WS_Request=mg_ws.WS_Request;
var WS_Reply=mg_ws.WS_Reply;
var WS_OnMessage=mg_ws.WS_OnMessage;

var ws = require("nodejs-websocket");

var C_WORKER_HEARTBEAT_INTERVAL = 30;       // 心跳时间，单位秒

function WorkerBusinessLogic(conn,data_o,_token){
    var _req=data_o.req || {};
    RpcController.run(_req,conn,function(ret){
        WS_Reply(conn,ret,_token);
    });
}

function Main(){
    if(!ws){ _d_("nodejs-websocket api needed"); process.exit(2); }
    _d_("pid=",process.pid);

    process.on("exit",function(){
        process.nextTick(function(){
            _d_('This should never run');
        });
        _d_('Going to exit.');
    });

    //argv返回的是一组包含命令行参数的数组。第一项为”node”，第二项为执行的js的完整路径，后面是附加在命令行后的参数
    //@ref: http://www.nodecn.org/process.html#process.argv
    var args= process.argv.splice(2);

    var _server_port=args[0];
    var _user=args[1];
    var _pwd=args[2];
    var _type = args[3];

    if(_server_port && _user && _pwd){
        //OK
    }else{
        _d_("param incorrect:",args);
        process.exit(3);
    }

    ///////////////////////////////
    try{
        var _conn=ws.connect(_server_port,
            function(){ //when connect, do worker sign on
                WS_Request(
                    _conn,
                    {_c: "worker_manager", _m: "registerWorker", _p: {"worker":((new Date()).pattern("MMddhhmmss.S")), "name":_user, "pwd":_pwd, "type": _type}},
                    function(rto) {
                        if (rto.STS == "KO") {
                            _d_("register worker failed ");
                            _conn.close();
                        } else {
                            setInterval(function() {
                                WS_Request(
                                    _conn,
                                    {_c: "worker_manager", _m: "ping", _p: +(new Date())},
                                    function(rto) {
                                        if (rto.STS == "KO") {
                                            _d_("keep live failed", rto.data);
                                        }
                                    }
                                );
                            }, C_WORKER_HEARTBEAT_INTERVAL * 1000);
                        }
                    }
                );
            });
        _conn.on("text", function (data_s) {
            _d_("on text",data_s);
            try{
                WS_OnMessage(_conn,data_s,WorkerBusinessLogic);
            }catch(ex){
                _d_("conn.text.err", ex.stack);
            }
        });
        _conn.on("error",function(e){
            _d_("conn.error",e);
            if(e && e.errno=='ECONNREFUSED'){
                _d_("server not online...");
            }
            process.exit(4);//exit when error
        });

        //Test>>>>>
        _conn.on("pong",function(data){
            _d_("pong",data+"pong time"+(new Date()).pattern("MMddhhmmss.S"));
        });
    }catch(e){
        _d_("ProcStartServer.e=",e);
    }
}
Main();

//@ref:
//npm http GET https://registry.npmjs.org/nodejs-websocket
//npm http 200 https://registry.npmjs.org/nodejs-websocket
//npm http GET https://registry.npmjs.org/nodejs-websocket/-/nodejs-websocket-0.1.5.tgz
//npm http 200 https://registry.npmjs.org/nodejs-websocket/-/nodejs-websocket-0.1.5.tgz
//nodejs-websocket@0.1.5 node_modules\nodejs-websocket
