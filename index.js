var mysql = require('mysql');

var conn = mysql.createConnection({
    host: "localhost",
    database: "sebu-db",
    user: "root",
    password: ""
});

conn.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");

    conn.query("SELECT * FROM Characters", function (err, result) {
        if (err) throw err;
        console.log("Result: \n" + JSON.stringify(result, null, 2));
    });
});

exports.query = function(c) {
    return conn.query(c);
}
