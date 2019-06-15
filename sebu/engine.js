module.exports = class Engine {

    constructor(config=null, callback=null) {
        if (!config || config instanceof Function) {
            callback = config;
            config = './config.json';
        }

        if (!config.prefix) {
            this.config = require(config);
            this.configFileName = config;
        } else {
            this.config = config;
            this.configFileName = null;
        }

        this.dico = require(`./lang/${this.config.lang || 'en'}.json`);
        this.commands = require('./commands.js');

        this.alias = {};
        this.helper = new (require('./helper.js'))(
            this.config.db.database, this.config.db.host, this.config.db.user, this.config.db.password,
            err => {
                if (err) {
                    console.log("Config settings: " + JSON.stringify(this.config, null, 2));
                    if (!callback) throw err;
                    return callback(err);
                }

                this.helper.select('Alias')
                        .catch(err => {
                            if (callback) callback(err);
                            else throw err;
                        })
                        .then(r => {
                            if (r) r.forEach(v => this.alias[v.key] = v.value);
                            if (callback) callback(null);
                        });
            }
        );
    }

    aliasReplace(message) {
        return (this.alias ? message.replace(/([^\@]|^)\@([^\@]*?)(\s|$)/g, (m, b, k, e) => b + this.alias[k] + e) : message).replace("@@", "@");
    }

    preprocess(input, output) {
        var args = this.aliasReplace(input.replace(this.config.prefix, "")).split(" ");

        if (args[0] == 'lang') {
            if (!args[1] || args[1] == "*") {
                output(`Current lang: ${this.dico.lang}.`)
                require('fs').readdir('./sebu/lang/', (err, files) => {
                    if (err) return output(err);
                    output(files.reduce((acc, cur) => acc + (cur.endsWith('.json') ? (acc?"\n":"") + cur.substring(0, cur.length - 5) : ""), ""));
                });
            } else {
                try {
                    let newDico = require('./lang/' + args[1] + '.json');
                    if (newDico) {
                        if (!newDico.sep)
                            newDico.sep = this.dico.sep;
                        this.dico = newDico;
                        this.dico.lang = args[1];
                    } else output(this.dico.msg.lang.empty);
                } catch (err) {
                    output(this.dico.msg.lang.missing, args[1]);
                }
                output(!this.dico.msg.hi ? `Missing CRUCIAL translation \`msg.hi\` (jk, lang changed to '${args[1]}').` : this.dico.msg.hi);
            }
        } else if (args[0] == 'config') {
            if (!args[1] || args[1] == "*") {
                let omitted = { host: true, user: true, password: true };
                output(JSON.stringify(this.config, (k, v) => omitted[k] ? "***" : v, 2));
            } else {
                let key_value = this.helper.splitOnce(args.slice(1).join(" "), "=");

                let key = key_value[0].trim();
                let value = key_value[1] ? key_value[1].trim() : undefined;

                if (this.config[key] && key != 'db') {
                    if (value) this.config[key] = value;
                    output(`config.${key} = ${this.config[key]}`);
                } else output(`${key} is not a valid key.`);
            }
        } else return args;
    }

    /**
     * Execute the appropriate command.
     * 
     * @param {String} input command to execute
     * @param {Function} output function taking the result string from the command
     */
    process(input, output) {
        if (!input.startsWith(this.config.prefix)) return false;

        if (input.includes(this.config.separator)) {
            let r = [];
            input.split(this.config.separator).forEach(part =>
                r.push(this.process(part.startsWith(this.config.prefix) ? part : this.config.prefix + part, output))
            );
            return r;
        }

        var args = this.preprocess(input.trim(), output);
        if (!args) return false;

        var comm = {
            c: this.commands,
            name: "commands",
            args: input
        };
        for (let k = 0; k < args.length; k++) {
            let next = this.dico.c && this.dico.c.hasOwnProperty(args[k]) ? this.dico.c[args[k]] : args[k];

            comm.name+= "." + next;
            comm.c = comm.c[next];

            if (comm.c instanceof Function) {
                try {
                    comm.args = args.slice(k + 1).join(" ");
                    this.helper.log('pre', `${comm.name} ( ${comm.args} )`);

                    let messaging = {
                        rawOut: output,
                        buffer: [],
                        def: { t: this.dico.msg.lang.untranslated, v: [ `${comm.name} ( ${comm.args} )` ] },
                        write: (t, ...v) => messaging.buffer.push(t ? this.helper.format(t, ...v) : this.helper.format(messaging.def.t, ...(v || messaging.def.v))), // TODO: rework message indicating missing translation
                        send: (t, ...v) => {
                            if (!messaging.buffer.length) messaging.write(t || this.dico.on.done, ...v);
                            output(messaging.buffer.join("\n"));
                            messaging.buffer = [];
                        }
                    };
                    let that = {
                        dico: this.dico,
                        alias: this.alias,
                        exec: script => this.execute(this.aliasReplace(script), output)
                    };

                    return comm.c(this.helper, comm.args, messaging, that);
                } catch (err) {
                    this.helper.log('pro', `$31${err.stack}`);
                    return output(this.helper.format(this.dico.msg.error, err));
                }
            } else if (!comm.c) {
                comm.args = args.slice(k + 1).join(" ");
                this.helper.log('pre', `${comm.name} ( ${comm.args} )`);
                return output(this.helper.format(this.dico.msg.command.missing, comm.name));
            }
        } return output(this.helper.format(this.dico.msg.command.malformed, comm.name));
    }

    evaluateExpression(expr) {
        return expr ? expr.trim() : expr;
    }

    verifyCondition(condition) {
        if (!condition) return true;

        condition = condition.trim()

        if (condition.startsWith("(") && condition.endsWith(")"))
            return this.verifyCondition(condition.substring(1, condition.length - 1));
        if (condition.startsWith("!"))
            return !this.verifyCondition(condition.substring(1));

        // #_# -> ##, # in (&, |)
        condition = condition.replace(/(&|\|)_\1/g, "$1$1");

        if (!condition.includes("||") && !condition.includes("&&")) {
            this.helper.log('scr', `Testing for atome condition '${condition}'.`);

            let k = condition.lastIndexOf("=");
            let tmp = condition.substring(0, k);

            let a = this.evaluateExpression(tmp.substring(0, tmp.length - 1));
            let b = this.evaluateExpression(condition.substring(k + 1));
            let c = tmp[tmp.length - 1];

            let r = {
                '=': a == b,
                '!': a != b,
                '<': a <= b,
                '>': a >= b
            } [c];

            if (r == undefined)
                this.helper.log('scr', `Malformed or missing conditional operator (found '${c}${b ? "=" : ""}').`);
            return r
        }

        // (.*##.*) -> (.*#_#.*), # in (&, |)
        condition = condition.replace(/(\(.*?)(&|\|)\2(.*?\))/g, "$1$2_$2$3");

        let or = condition.split("||");
        for (let i = 0; i < or.length; i++) {
            let r = true;

            let and = or[i].split("&&");
            for (let j = 0; j < and.length; j++) {
                if (!this.verifyCondition(and[j])) {
                    r = false;
                    break;
                }
            }

            if (r) return true;
        }

        return false;
    }

    executeAction(action, output) {
        if (action) {
            action = action.trim();
            this.helper.log('scr', `Execute action '${action}'.`);
            this.process(action.startsWith(this.config.prefix) ? action : this.config.prefix + action, output);
        }
    }

    execute(script, output) {
        script.split(";").forEach(l => {
            let condition_actions = l.split("?");

            let actions = (condition_actions[1] || l).split(":");
            let condition = condition_actions[1] ? condition_actions[0] : null;

            this.executeAction(this.verifyCondition(condition) ? actions[0] : actions[1], output);
        });
    }

    pause(callback) { // TODO: update configs (save to `configFileName` -- null if config passed in constructor was config object)
        if (callback) callback("This function does nothing :D");
    }

    stop(callback) {
        this.pause();
        this.helper.stop(callback);
    }

}

/*-*/
