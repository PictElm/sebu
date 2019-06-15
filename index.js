var engine = new (require('./sebu/engine.js'))(err => {
    if (err) {
        console.log(`Something went wrong connecting: "${err}"`);
        process.exit();
    } console.log("Engine is ready!");
});

process.stdin.setEncoding('utf-8');
process.stdin.on('data', function(data) {
    data = data.substring(0, data.length - 2);
    if (data.startsWith("exit")) {
        console.log("User input complete, program exit.");
        engine.stop(process.exit);
    } else engine.process(data, message => console.log(`<sebu>: ${(message || "").replace(/\n/g, "\n        ")}`));
});

/*-*/
