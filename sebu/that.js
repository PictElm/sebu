exports.Engine = class Sebu {

    constructor(database, host="localhost", user="root", password="") {
        this.dico = require('./lang/en.json');
        this.prefix = this.dico.sep.prefix || "sebu, ";
        this.separator = this.dico.sep.separator || " then ";

        this.alias = {};

        const Helper = require('./helper.js');
        this.helper = new Helper(database, host, user, password,
            () => this.helper.select('Alias').then(r => r.forEach(v => this.alias[v.key] = v.value))
        );

        this.commands = require('./commands.js');
    }

    aliasReplace(message) {
        return (this.alias ? message.replace(/([^\@]|^)\@([^\@]*?)(\s|$)/g, (m, b, k, e) => b + this.alias[k] + e) : message).replace("@@", "@");
    }

    preprocess(input, output) {
        if (input.startsWith(this.prefix)) {
            var args = this.aliasReplace(input.replace(this.prefix, "")).split(" ");

            if (args[0] == 'lang') {
                    if (args[1] == "*") {
                        require('fs').readdir('./sebu/lang/', (err, files) => {
                            if (err) return output(err);
                            output(files.reduce((acc, cur) => acc + (cur.endsWith('.json') ? (acc?"\n":"") + cur.substring(0, cur.length - 5) : ""), ""));
                        });
                    } else {
                        try {
                            let newDico = require('./lang/' + args[1] + '.json');
                            if (newDico) {
                                if (!newDico.sep) newDico.sep = this.dico.sep;
                                this.dico = newDico;

                                if (this.dico.sep.prefix) this.prefix = this.dico.sep.prefix;
                                if (this.dico.sep.separator) this.separator = this.dico.sep.separator;
                            } else output(this.dico.msg.lang.empty);
                        } catch (err) {
                            output(this.dico.msg.lang.missing, args[1]);
                        }
                        output(!this.dico.msg.hi ? `Missing CRUCIAL translation \`msg.hi\` (jk, lang changed to '${args[1]}').` : this.dico.msg.hi);
                    }
            } else return args;
        }
        return false;
    }

    /**
     * Execute the appropriate command.
     * 
     * @param {String} input command to execute
     * @param {Function} output function taking the result string from the command
     */
    process(input, output) {
        if (input.includes(this.separator)) {
            let r = [];
            input.split(this.separator).forEach(part =>
                r.push(this.process(part.startsWith(this.prefix) ? part : this.prefix + part, output))
            );
            return r;
        }

        var args = this.preprocess(input, output);
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
            this.process(action.startsWith(this.prefix) ? action : this.prefix + action, output);
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

    stop() {
        this.helper.stop();
    }

}

/*-*/
