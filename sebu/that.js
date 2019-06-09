exports.Engine = class Sebu {

    static splitOnce(text, separator) {
        let k = text.indexOf(separator);
        return [text.substring(0, k), text.substring(k + 1)]
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
        return message; //.replace(/\@(.*?) /, (m, k) => await this.helper.select('Alias', { key: k })[0]);
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
            name: "this.commands",
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
                    return comm.c(this.helper, comm.args, (t, ...v) => output(this.helper.format(t, ...v)), this.dico);
                } catch (err) {
                    this.helper.log('pro', err)
                    return output(this.helper.format(this.dico.msg.error.internal, err));
                }
            } else if (!comm.c) return output(this.dico.msg.error.command.missing);
        }
    }

    constructor(database, host = "localhost", user = "root", password = "") {
        const Helper = require('./helper.js');
        this.helper = new Helper(database, host, user, password);

        this.dico = require('./lang/en.json');
  
        this.prefix = "sebu, ";
        this.commands = {
            detail: {
                chara: function (q, m, o, d) {
                    q.select('Charas', { name: m }).then(r => o(d.on.detail.chara, r[0].name));
                },
                place: function (q, m, o, d) {
                    q.select('Places', { name: m }).then(r => o(d.on.detail.place, r[0].name));
                },
                item: function (q, m, o, d) {
                    q.select('Items', { name: m }).then(r => o(d.on.detail.item, r[0].name));
                },
                alias: function (q, m, o, d) {
                    q.select('Alias', { key: m }).then(r => o(d.on.detail.alias, r[0].key, r[0].value));
                },
                all: {
                    charas: function (q, m, o, d) {
                        q.select('Charas').then(r => r.length ? r.forEach(v => o(d.on.detail.all.charas, v.name)) : o(d.on.detail.all.empty));
                    },
                    places: function (q, m, o, d) {
                        q.select('Places').then(r => r.length ? r.forEach(v => o(d.on.detail.all.places, v.name)) : o(d.on.detail.all.empty));
                    },
                    items: function (q, m, o, d) {
                        q.select('Items').then(r => r.length ? r.forEach(v => o(d.on.detail.all.items, v.name)) : o(d.on.detail.all.empty));
                    },
                    alias: function (q, m, o, d) {
                        q.select('Alias').then(r => r.length ? r.forEach(v => o(d.on.detail.all.alias, v.key, v.value)) : o(d.on.detail.all.empty));
                    }
                },
                everything: function (q, m, o, d) { // TODO: untested
                    q.select('Charas').then(r => r.length ? r.forEach(v => o(d.on.detail.all.charas, v.name)) : o(d.on.detail.all.empty));
                    q.select('Places').then(r => r.length ? r.forEach(v => o(d.on.detail.all.place, v.name)) : o(d.on.detail.all.empty));
                    q.select('Items').then(r => r.length ? r.forEach(v => o(d.on.detail.all.items, v.name)) : o(d.on.detail.all.empty));
                    q.select('Alias').then(r => r.length ? r.forEach(v => o(d.on.detail.all.alias, v.key, v.value)) : o(d.on.detail.all.empty));
                }
            },
            create: {
                chara: function (q, m, o, d) {
                    q.insert('Charas', { name: m }).then(() => o(d.on.create.chara, m));
                },
                place: function (q, m, o, d) {
                    q.insert('Places', { name: m }).then(() => o(d.on.create.place, m));
                },
                item: function (q, m, o, d) {
                    let nb_item = Sebu.splitOnce(m, "x ");

                    let itemName = nb_item[1];
                    let nb = nb_item[0];

                    q.select('Items', { name: itemName }).then((rows) => {
                        let item = rows[0];

                        if (!item) {
                            q.insert('Items', { name: itemName, total: nb, left: nb }).then(
                                () => o(d.on.create.item.new, nb, itemName)
                            );
                        } else {
                            q.update('Items', { id: item.id }, { total: item.total + nb, left: item.left + nb }).then(
                                () => o(d.on.create.item.old, item.total + nb, item.name)
                            );
                        }
                    })
                },
                alias: function (q, m, o, d) {
                    let key_value = Sebu.splitOnce(m, " ");
                    q.insert('Alias', { key: key_value[0], value: key_value[1] }).then(
                        () => o(d.on.create.alias, key_value[0], key_value[1])
                    );
                }
            },
            edit: {
                chara: {
                    desc: function (q, m, o, d) {
                        let name_desc = Sebu.splitOnce(m, ", ");
                        q.update('Charas', { name: name_desc[0] }, { desc: name_desc[1] }).then(o(d.on.done));
                    }
                },
                place: {
                    desc: function (q, m, o, d) {
                        let name_desc = Sebu.splitOnce(m, ", ");
                        q.update('Places', { name: name_desc[0] }, { desc: name_desc[1] }).then(o(d.on.done));
                    }
                },
                item: {
                    desc: function (q, m, o, d) {
                        let name_desc = Sebu.splitOnce(m, ", ");
                        q.update('Items', { name: name_desc[0] }, { desc: name_desc[1] }).then(o(d.on.done));
                    }
                },
                alias: function (q, m, o, d) {
                    let key_value = Sebu.splitOnce(m, " ");
                    q.update('Alias', { key: key_value[0] }, { value: key_value[1] }).then(o(d.on.done));
                }
            },
            remove: {
                chara: function (q, m, o, d) {
                    q.delete('Charas', { name: m }).then(() => o(d.on.remove.chara, m));
                },
                place: function (q, m, o, d) {
                    q.delete('Places', { name: m }).then(() => o(d.on.remove.place, m));
                },
                item: function (q, m, o, d) {
                    let nb_item = Sebu.splitOnce(m, "x ");

                    let itemName = nb_item[1];
                    let nb = nb_item[0];

                    q.select('Items', { name: itemName }).then((rows) => {
                        let item = rows[0];

                        if (!item) {
                        } else {
                            if (nb < this.item.count) {
                                q.update('Items', { id: item.id }, { count: item.count - nb }).then(() => o(d.on.remove.item, nb, m));
                            } else {
                                q.delete('Items', { id: item.id }).then(() => o(d.on.remove.item, item.count, m));
                            }
                        }
                    })
                },
                alias: function (q, m, o, d) {
                    q.delete('Alias', { key: m }).then(o(d.on.remove.alias, m));
                },
                all: {
                    charas: function (q, m, o, d) {
                        q.delete('Charas').then(() => o(d.on.remove.all.charas));
                    },
                    places: function (q, m, o, d) {
                        q.delete('Places').then(() => o(d.on.remove.all.places));
                    },
                    items: function (q, m, o, d) {
                        q.delete('Items').then(() => o(d.on.remove.all.items));
                    },
                    alias: function (q, m, o, d) {
                        q.delete('Alias').then(() => o(d.on.remove.all.alias));
                    }
                },
                everything: function (q, m, o, d) { // TODO: untested
                    q.delete('Charas').then(() => o(d.on.remove.all.charas));
                    q.delete('Places').then(() => o(d.on.remove.all.places));
                    q.delete('Items').then(() => o(d.on.remove.all.items));
                    q.delete('Alias').then(() => o(d.on.remove.all.alias));
                    o(d.on.remove.everything);
                }
            },
            give: async function (q, m, o, d) {
                let item_chara = Sebu.splitOnce(m, " to ");
                let nb_item = Sebu.splitOnce(item_chara[0], "x ");

                let itemName = nb_item[1];
                let nb = nb_item[0];
                let charaName = item_chara[1];

                let item = await q.select('Item', { name: itemName })[0];
                let chara = await q.select('Charas', { name: charaName })[0];

                q.select('Have', { chara: chara.id, item: item.id }).then(function (rows) {
                    let have = rows[0];
                    if (item.left < nb) nb = item.left;

                    if (!have) {
                        q.insert('Have', { chara: chara.id, item: item.id, count: nb });
                        o(d.on.give.new, chara.name, nb, item.name);
                    } else {
                        q.update('Have', { chara: chara.id, item: item.id }, { count: nb + have.count });
                        o(chara.name + " now have " + (nb + have.count) + "x " + item.name + ".");
                        o(d.on.give.old, chara.name, (nb + have.count), item.name);
                    }

                    q.update('Items', { id: item.id }, { left: item.left - nb }).then(
                        () => o(d.on.detail.item, item.left - nb, item.name) // TODO: update values list
                    )
                });
            },
            take: (q, m, o, d) => this.commands.give(q, "-" + m, o, d),
            move: async function (q, m, o, d) {
                let chara_place = Sebu.splitOnce(m, " to ");

                let charaName = chara_place[0];
                let placeName = chara_place[1];

                let chara = await q.select('Charas', { name: charaName })[0];

                q.select('Places', { name: placeName }).then(function (rows) {
                    let place = rows[0];
                    q.update('Charas', { id: chara.id }, { place: place.id }).then(
                        () => o(d.on.move.new, chara.name, place.name)
                    );
                })
            }
        };
    }

}

/*-*/
