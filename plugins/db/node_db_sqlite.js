var mg_core=require("mega-common").core;
var s2o=mg_core.s2o;
var o2s=mg_core.o2s;

var config = require('./node_db_sqlite_config.js');		
var sqlite3 = require('sqlite3').verbose();
var logger = require('../logger/index.js');

var initSQLs = config.dbInitSQLs.slice(0);

var initialized = false;
var initializing = false;
var freeConnList = [];
var waitConnList = [];

var getConn = function(callback) {
	if (freeConnList.length > 0) {
		callback(freeConnList.shift());
	} else if (!initializing && !initialized) {			
		initializing = true;

		var db = new sqlite3.Database(':memory:');		
		init(db, function(){
			var addFreeConn = function(conn) {
				freeConnList.push(conn);

				if (freeConnList.length < config.CONNECTION_POOL_SIZE) {
					var newDb = new sqlite3.Database(':memory:');
					attachDb(newDb, function(){
						addFreeConn(newDb);
					});
				} else {
					initializing = false;
					initialized = true;

					callback.call(null, freeConnList.shift());

					var waitItem;
					while ((waitItem = waitConnList.shift()) && freeConnList.length > 0) {
						waitItem.call(null, freeConnList.shift());
					}	
				}
			};

			attachDb(db, function(){
				addFreeConn(db);
			});				
		});
	} else {
		waitConnList.push(callback);
	}
};

var releaseConn = function(db) {
	if (waitConnList.length > 0) {
		waitConnList.shift().call(null, db);
	} else {
		freeConnList.push(db);
	}
};

var attachDb = function(db, callback) {
	var dbs = Object.keys(config.dbList);

	var runNext = function() {
		var dbKey = dbs.shift();
		if (dbKey) 
			db.run('ATTACH DATABASE "' + config.dbList[dbKey] + '" AS "' + dbKey + '"',function(err) {
				if (err) console.log("attach db error:",err);
				runNext();
			});
		else
			callback();
	};

	runNext();
};

var init = function(db, cb) {
	if (initSQLs.length > 0) {
		console.log("db init");
		db.run(initSQLs.shift(),function(err) {
			if (err) console.log("init db error:",err);
			init(db, cb);
		});
	} else {
		console.log("db init finished");
		cb();
	}
};

var log = function(text) {
    logger.log(text, "sql-time");
};

exports.orm = function(p, callback) {
    var btime = new Date();
    getConn(function (db) {
        var mtime = new Date();
        var cb = function (err, data) {
            var etime = new Date();
            releaseConn(db);
            callback(err, data);
            if (config.SLOW_LOG && parseInt(etime - btime) > config.SLOW_LOG) log(btime.pattern("hhmmss.S") + " - " + mtime.pattern("hhmmss.S") + " - " + etime.pattern("hhmmss.S") + " - " + o2s(p));
        };

        getModelClass(p.model, function (err, ModelClass) {
            if (err) {
                cb("Cannot get model class - " + err, null);
            } else {
                switch (p.action) {
                    case "delete":
                        var model = new ModelClass(p.data);
                        model.destroy(function (err) {
                            cb(err, null);
                        });
                        break;
                    case "save":
                        for (var i in p.data) {
                            ModelClass.upsert(p.data[i], function (err) {
                                cb(err, null);
                            });
                        }
                        break;
                    case "insert":
                        ModelClass.create(p.data[i], function (err) {
                            cb(err, null);
                        });
                    case "update":
                        var model = new ModelClass(p.data);
                        model.save(function (err) {
                            cb(err, null);
                        });
                        break;
                    case "search":
                        ModelClass.all({
                            where: p.filter,
                            order: p.order,
                            limit: p.limit,
                            skip: p.skip
                        }, function (err, data) {
                            cb(err, data);
                        });
                        break;
                    case "get":
                        ModelClass.find(p.key, function (err, data) {
                            cb(err, data);
                        });
                        break;
                }
            }
        });
    });
};

exports.query = function(sql, args, callback) {
    var btime = new Date();
    getConn(function(db) {
        var mtime = new Date();
        var cb = function (err, data) {
            var etime = new Date();
            releaseConn(db);
            callback(err, data);
            if (config.SLOW_LOG && parseInt(etime - btime) > config.SLOW_LOG) log(btime.pattern("hhmmss.S") + " - " + mtime.pattern("hhmmss.S") + " - " + etime.pattern("hhmmss.S") + " - " + o2s(p));
        };

        runSql(db, sql, args, cb);
    });
};

exports.multi_query = function(cmds, callback) {
    var btime = new Date();
    getConn(function(db) {
        var mtime = new Date();
        var cb = function (err, data) {
            var etime = new Date();
            releaseConn(db);
            callback(err, data);
            if (config.SLOW_LOG && parseInt(etime - btime) > config.SLOW_LOG) log(btime.pattern("hhmmss.S") + " - " + mtime.pattern("hhmmss.S") + " - " + etime.pattern("hhmmss.S") + " - " + o2s(p));
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
                    runSql(db, cmd.sql, cmd.args, nextFunc);
                }
            };

            cmd = cmds.shift();
            runSql(db, cmd.sql, cmd.args, nextFunc);
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
	
		var nextFunc = function(err, data) {
			if (err) {
				console.log(err);
				cb(err);				
			} else if (segments.length == 0) {
				cb(null,data);
			} else if ((a = args.shift())) {
				conn.all(segments.shift(),a,nextFunc);
			} else {
				conn.all(segments.shift(),nextFunc);
			}
		};
	
		if ((a = args.shift())) {
			conn.all(segments.shift(),a,nextFunc);
		} else {
			conn.all(segments.shift(),nextFunc);
		}
	} catch(e) {
		cb(e);
	}
}

function getModelClass(name, cb) {
	var Schema = require('jugglingdb').Schema;
	var schema = new Schema('sqlite3', {
    database: config.dbList[config.db]
	});

	var defination = config.modelDefinations[name];
	if (defination) {		
		var mc = schema.define(defination.modelName, defination.properties, defination.settings);
		schema.autoupdate(function(err) {
			if (err)
				cb(err);
			else
				cb(null, mc);				
		});
	} else {
		cb('No model defination');
	}
}
