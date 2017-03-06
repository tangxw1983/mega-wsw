var mg_core=require("mega-common").core;
var s2o=mg_core.s2o;
var o2s=mg_core.o2s;

var config = require('./node_db_mysql_config.js');		
var mysql = require('mysql');
var logger = require('../logger/index.js');

var _pool = mysql.createPool({
    host: config.host,
    port: config.port || 3306,
    user: config.user,
    password: config.password,
    database: config.database
});

var log = function(text) {
    logger.log(text, "sql-time");
};

exports.query = function(sql, args, callback) {
    var btime = new Date();
    _pool.getConnection(function(err,client){
        if (!!err) {
            console.error('[sqlqueryErr] '+err.stack);
            callback(err);
            return;
        }

        var mtime = new Date();
        runSql(client, sql, args, function(err, data){
            var etime = new Date();
            client.release();
            callback(err, data);
            if (config.SLOW_LOG && parseInt(etime-btime)>config.SLOW_LOG)
                log(btime.pattern("hhmmss.S") + " - " + mtime.pattern("hhmmss.S") + " - " + etime.pattern("hhmmss.S") + " - " + o2s(p));
        });
    });
};

exports.multi_query = function(cmds, callback) {
    var btime = new Date();
    _pool.getConnection(function (err, client) {
        if (!!err) {
            console.error('[sqlqueryErr] ' + err.stack);
            callback(err);
            return;
        }

        var mtime = new Date();
        var cb = function (err, data) {
            var etime = new Date();
            client.release();
            callback(err, data);
            if (config.SLOW_LOG && parseInt(etime - btime) > config.SLOW_LOG)
                log(btime.pattern("hhmmss.S") + " - " + mtime.pattern("hhmmss.S") + " - " + etime.pattern("hhmmss.S") + " - " + o2s(p));
        };

        try {
            var cmd,
                ret = [];

            var nextFunc = function (err, data) {
                ret.push(data);

                if (err) {
                    cb(err);
                } else if (cmds.length == 0) {
                    cb(null, ret);
                } else {
                    cmd = cmds.shift();
                    runSql(client, cmd.sql, cmd.args, nextFunc);
                }
            };

            cmd = cmds.shift();
            runSql(client, cmd.sql, cmd.args, nextFunc);
        } catch (e) {
            cb(e);
        }
    });
};

function runSql(conn, sql, args, cb) {
	try {
		var segments = sql.split(';');
		var a;
	
		if (segments[segments.length - 1].replace(/(^\s*)/g,'')=='') segments.pop();

        if (!args)
            args = [];
        else if (!(Object.prototype.toString.call(args[0]) === '[object Array]'))
            args = [args];
	
		var nextFunc = function(err, data, fields) {
			if (err) {
				console.log(err);
				cb(err);				
			} else if (segments.length == 0) {
				cb(null,data);
			} else if ((a = args.shift())) {
				conn.query(segments.shift(),a,nextFunc);
			} else {
				conn.query(segments.shift(),nextFunc);
			}
		};
	
		if ((a = args.shift())) {
			conn.query(segments.shift(),a,nextFunc);
		} else {
			conn.query(segments.shift(),nextFunc);
		}
	} catch(e) {
		cb(e);
	}
}
