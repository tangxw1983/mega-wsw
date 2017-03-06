var mg_core=require("mega-common").core;
var s2o=mg_core.s2o;
var o2s=mg_core.o2s;

var config = require('./config.js');
var adapter = null;
if (config.dbAdapter=="sqlite3") {
    adapter = require("./node_db_sqlite.js");
} else if (config.dbAdapter=="mysql") {
    adapter = require("./node_db_mysql.js");
}

exports.query = function(callback, p) {
    if (typeof p == "string") p = s2o(p);

    if (adapter) {
        adapter.query(p.sql, p.args, callback);
    } else {
        callback("No adapter defination");
    }
};

exports.multi_query = function(callback, p) {
    if (typeof p == "string") p = s2o(p);

    if (adapter) {
        adapter.multi_query(p.cmds, callback);
    } else {
        callback("No adapter defination");
    }
};