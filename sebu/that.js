exports.Engine = class Sebu {

    stop() {
        this.helper.stop();
    }

    preprocess(input, output) {
        if (input.startsWith(this.prefix)) {
            var args = input.replace(this.prefix, "").split(" ");

            switch (args[0]) {
                case 'help':
                    output(this.dico.help);
                    break;

                case 'lang':
                    try {
                        this.dico = require('./lang/' + args[1] + '.json');
                    } catch (err) {
                        output(this.dico.msg.lang.missing, args[1]);
                        return false;
                    }
                    output(!this.dico ? this.dico.msg.lang.empty : this.dico.msg.hi);
                    break;

                default: return args;
            }
        }
        return false;
    }

    aliasReplace(message) {
        return this.alias ? message.replace(/\@(.*?)(\s|$)/, (m, k, s) => this.alias[k] + s) : message;
    }

    /**
     * Execute the appropriate command.
     * 
     * @param {String} input command to execute
     * @param {Function} output function taking the result string from the command
     */
    process(input, output) {
        var args = this.preprocess(input, output);
        if (!args) return;

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
                    comm.args = this.aliasReplace(args.slice(k + 1).join(" "));
                    this.helper.log('pre', `${comm.name} ( ${comm.args} )`);

                    let messaging = {
                        buffer: [],
                        def: { t: `${this.dico.msg.lang.untranslated}`, v: [ `${comm.name} ( ${comm.args} )` ] },
                        write: (t, ...v) => messaging.buffer.push(t ? this.helper.format(t, ...v) : this.helper.format(messaging.def.t, ...messaging.def.v)),
                        send: (t, ...v) => {
                            if (!messaging.buffer.length) messaging.write(t || this.dico.on.done, ...v);
                            output(messaging.buffer.join("\n"));
                            messaging.buffer = [];
                        }
                    };
                    return comm.c(this.helper, comm.args, messaging, this.dico, this.alias);
                } catch (err) {
                    this.helper.log('pro', err.stack)
                    return output(this.helper.format(this.dico.msg.error, err));
                }
            } else if (!comm.c) {
                comm.args = this.aliasReplace(args.slice(k + 1).join(" "));
                this.helper.log('pre', `${comm.name} ( ${comm.args} )`);
                return output(this.helper.format(this.dico.msg.command.missing, comm.name));
            }
        }
    }

    constructor(database, host="localhost", user="root", password="") {
        this.dico = require('./lang/en.json');
        this.alias = {};

        const Helper = require('./helper.js');
        this.helper = new Helper(database, host, user, password,
            () => this.helper.select('Alias').then(r => r.forEach(v => this.alias[v.key] = v.value))
        );

        this.prefix = "sebu, ";
        this.commands = require('./commands.js');
    }

}

/*-*/
