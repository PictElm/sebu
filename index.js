var mysql = require('mysql');

var conn = mysql.createConnection({
    host: "localhost",
    database: "sebu",
    user: "root",
    password: ""
});

conn.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");

    conn.query("SELECT * FROM Characters", function(err, result) {
        if (err) throw err;
        console.log("Result: \n" + JSON.stringify(result, null, 2));
    });
});

process.stdin.setEncoding('utf-8');
process.stdin.on('data', function(data) {
    if(data.startsWith("exit")) {
        console.log("User input complete, program exit.");
        process.exit();
    } else console.log("User Input Data : '" + data.substring(0, data.length - 1) + "'");
});
