exports.Engine = class Sebu {

    static splitOnce(text, separator) {
        let k = text.indexOf(separator);
        return [ text.substring(0, k), text.substring(k + separator.length) ];
    }

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

                    let messages = [];
                    return comm.c(
                            this.helper,
                            comm.args,
                            {
                                write: (t, ...v) => messages.push(this.helper.format(t, ...v)),
                                send: (t, ...v) => {
                                    let m = messages.join("\n")
                                    output(m + (t ? (m ? "\n" : "") + this.helper.format(t, ...v) : ""));
                                    messages = [];
                                }
                            },
                            this.dico,
                            this.alias
                        );
                } catch (err) {
                    this.helper.log('pro', err)
                    return output(this.helper.format(this.dico.msg.error.internal, err));
                }
            } else if (!comm.c) {
                comm.args = this.aliasReplace(args.slice(k + 1).join(" "));
                this.helper.log('pre', `${comm.name} ( ${comm.args} )`);
                return output(this.dico.msg.error.command.missing);
            }
        }
    }

    constructor(database, host="localhost", user="root", password="") {
        const Helper = require('./helper.js');
        this.helper = new Helper(database, host, user, password);

        this.dico = require('./lang/en.json');
        this.alias = {};
        this.helper.select('Alias').then(r => r.forEach(v => this.alias[v.key] = v.value));

        this.prefix = "sebu, ";
        this.commands = {
            detail: {
                chara: function (q, m, o, d, a) {
                    q.select('Charas', { name: m }).then(r => o.send(d.on.detail.chara, r[0].name));
                },
                place: function (q, m, o, d, a) {
                    q.select('Places', { name: m }).then(r => o.send(d.on.detail.place, r[0].name));
                },
                item: function (q, m, o, d, a) {
                    q.select('Items', { name: m }).then(r => o.send(d.on.detail.item, r[0].name));
                },
                alias: function (q, m, o, d, a) {
                    q.select('Alias', { key: m }).then(r => o.send(d.on.detail.alias, r[0].key, r[0].value));
                },
                all: {
                    charas: function (q, m, o, d, a) {
                        q.select('Charas').then(r => r.length ? r.forEach(v => o.write(d.on.detail.all.charas, v.name)) + o.send() : o.send(d.on.detail.all.empty));
                    },
                    places: function (q, m, o, d, a) {
                        q.select('Places').then(r => r.length ? r.forEach(v => o.write(d.on.detail.all.places, v.name)) + o.send() : o.send(d.on.detail.all.empty));
                    },
                    items: function (q, m, o, d, a) {
                        q.select('Items').then(r => r.length ? r.forEach(v => o.write(d.on.detail.all.items, v.name)) + o.send() : o.send(d.on.detail.all.empty));
                    },
                    alias: function (q, m, o, d, a) {
                        q.select('Alias').then(r => r.length ? r.forEach(v => o.write(d.on.detail.all.alias, v.key, v.value)) + o.send() : o.send(d.on.detail.all.empty));
                    }
                },
                everything: function (q, m, o, d, a) {
                    q.select('Charas').then(r => r.length ? r.forEach(v => o.write(d.on.detail.all.charas, v.name)) + o.send() : o.send(d.on.detail.all.empty));
                    q.select('Places').then(r => r.length ? r.forEach(v => o.write(d.on.detail.all.places, v.name)) + o.send() : o.send(d.on.detail.all.empty));
                    q.select('Items').then(r => r.length ? r.forEach(v => o.write(d.on.detail.all.items, v.name)) + o.send() : o.send(d.on.detail.all.empty));
                    q.select('Alias').then(r => r.length ? r.forEach(v => o.write(d.on.detail.all.alias, v.key, v.value)) + o.send() : o.send(d.on.detail.all.empty));
                }
            },
            create: {
                chara: function (q, m, o, d, a) {
                    q.insert('Charas', { name: m }).then(() => o.send(d.on.create.chara, m));
                },
                place: function (q, m, o, d, a) {
                    q.insert('Places', { name: m }).then(() => o.send(d.on.create.place, m));
                },
                item: function (q, m, o, d, a) {
                    let nb_item = Sebu.splitOnce(m, "x ");

                    let itemName = nb_item[1];
                    let nb = nb_item[0];

                    q.select('Items', { name: itemName }).then((rows) => {
                        let item = rows[0];

                        if (!item) {
                            q.insert('Items', { name: itemName, total: nb, left: nb }).then(
                                () => o.send(d.on.create.item.new, nb, itemName)
                            );
                        } else {
                            q.update('Items', { name: item.name }, { total: item.total + nb, left: item.left + nb }).then(
                                () => o.send(d.on.create.item.old, item.total + nb, item.name)
                            );
                        }
                    })
                },
                alias: function (q, m, o, d, a) {
                    let key_value = Sebu.splitOnce(m, " for ");
                    a[key_value[0]] = key_value[1];
                    q.insert('Alias', { key: key_value[0], value: key_value[1] }).then(
                        () => o.send(d.on.create.alias, key_value[0], key_value[1])
                    );
                }
            },
            edit: {
                chara: {
                    desc: function (q, m, o, d, a) {
                        let name_desc = Sebu.splitOnce(m, ", ");
                        q.update('Charas', { name: name_desc[0] }, { desc: name_desc[1] }).then(o.send(d.on.done));
                    }
                },
                place: {
                    desc: function (q, m, o, d, a) {
                        let name_desc = Sebu.splitOnce(m, ", ");
                        q.update('Places', { name: name_desc[0] }, { desc: name_desc[1] }).then(o.send(d.on.done));
                    }
                },
                item: {
                    desc: function (q, m, o, d, a) {
                        let name_desc = Sebu.splitOnce(m, ", ");
                        q.update('Items', { name: name_desc[0] }, { desc: name_desc[1] }).then(o.send(d.on.done));
                    }
                },
                alias: function (q, m, o, d, a) {
                    let key_value = Sebu.splitOnce(m, " for ");
                    a[key_value[0]] = key_value[1];
                    q.update('Alias', { key: key_value[0] }, { value: key_value[1] }).then(o.send(d.on.done));
                }
            },
            remove: {
                chara: function (q, m, o, d, a) {
                    q.delete('Charas', { name: m }).then(() => o.send(d.on.remove.chara, m));
                },
                place: function (q, m, o, d, a) {
                    q.delete('Places', { name: m }).then(() => o.send(d.on.remove.place, m));
                },
                item: function (q, m, o, d, a) {
                    let nb_item = Sebu.splitOnce(m, "x ");

                    let itemName = nb_item[1];
                    let nb = nb_item[0];

                    q.select('Items', { name: itemName }).then((rows) => {
                        let item = rows[0];

                        if (!item) {
                        } else {
                            if (nb < this.item.count) {
                                q.update('Items', { name: item.name }, { count: item.count - nb }).then(() => o.send(d.on.remove.item, nb, m));
                            } else {
                                q.delete('Items', { name: item.name }).then(() => o.send(d.on.remove.item, item.count, m));
                            }
                        }
                    })
                },
                alias: function (q, m, o, d, a) {
                    delete a[m];
                    q.delete('Alias', { key: m }).then(o.send(d.on.remove.alias, m));
                },
                all: {
                    charas: function (q, m, o, d, a) {
                        q.delete('Charas').then(() => o.send(d.on.remove.all.charas));
                    },
                    places: function (q, m, o, d, a) {
                        q.delete('Places').then(() => o.send(d.on.remove.all.places));
                    },
                    items: function (q, m, o, d, a) {
                        q.delete('Items').then(() => o.send(d.on.remove.all.items));
                    },
                    alias: function (q, m, o, d, a) {
                        q.delete('Alias').then(() => o.send(d.on.remove.all.alias)); // TODO: remove from this.alias
                    }
                },
                everything: function (q, m, o, d, a) {
                    q.delete('Charas').then(() => o.send(d.on.remove.all.charas));
                    q.delete('Places').then(() => o.send(d.on.remove.all.places));
                    q.delete('Items').then(() => o.send(d.on.remove.all.items));
                    q.delete('Alias').then(() => o.send(d.on.remove.all.alias)); // TODO: remove from this.alias
                    o.send(d.on.remove.everything);
                }
            },
            give: async function (q, m, o, d, a) {
                let item_chara = Sebu.splitOnce(m, " to ");
                let nb_item = Sebu.splitOnce(item_chara[0], "x ");

                let itemName = nb_item[1];
                let nb = nb_item[0];
                let charaName = item_chara[1];

                let item = await q.select('Item', { name: itemName })[0];
                let chara = await q.select('Charas', { name: charaName })[0];

                q.select('Have', { chara: chara.name, item: item.name }).then(function (rows) {
                    let have = rows[0];
                    if (item.left < nb) nb = item.left;

                    if (!have) {
                        q.insert('Have', { chara: chara.name, item: item.name, count: nb });
                        o.send(d.on.give.new, chara.name, nb, item.name);
                    } else {
                        q.update('Have', { chara: chara.name, item: item.name }, { count: nb + have.count });
                        o.send(chara.name + " now have " + (nb + have.count) + "x " + item.name + ".");
                        o.send(d.on.give.old, chara.name, (nb + have.count), item.name);
                    }

                    q.update('Items', { name: item.name }, { left: item.left - nb }).then(
                        () => o.send(d.on.detail.item, item.left - nb, item.name) // TODO: update values list
                    )
                });
            },
            take: (q, m, o, d, a) => this.commands.give(q, "-" + m, o, d),
            move: async function (q, m, o, d, a) {
                let chara_place = Sebu.splitOnce(m, " to ");

                let charaName = chara_place[0];
                let placeName = chara_place[1];

                q.select('Charas', { name: charaName }).then(function (rows1) {
                    let chara = rows1[0];
                    q.select('Places', { name: placeName }).then(function (rows2) {
                        let place = rows2[0];
                        q.update('Charas', { name: chara.name }, { place: place.name }).then(
                            () => o.send(d.on.move.new, chara.name, place.name)
                        );
                    });
                });
            }
        };
    }

}

/*-*/
