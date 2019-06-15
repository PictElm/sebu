module.exports = {
    help: function(q, m, o, t) {
        if (!m) return o.send(t.dico.help);
        if (!o) return q.toDicoLang("help _command_", t.dico.c);

        let targetName = "";
        let targetComm = module.exports;
        let targetHelp = t.dico.help;

        if (m == "*" || m == t.dico.c["*"]) {
            targetName+= ".everything";
            targetHelp = targetHelp.everything;
        } else m.split(" ").forEach(arg => {
            let next = t.dico.c && t.dico.c.hasOwnProperty(arg) ? t.dico.c[arg] : arg;

            targetName+= "." + next;
            targetComm = targetComm ? targetComm[next] : undefined;
            targetHelp = targetHelp ? targetHelp[next] : undefined;
        });

        q.log('hlp', `$32commands${targetName}`);
        o.write(targetHelp, "help" + targetName);
        let unpack = sub => {
            if (sub instanceof Function) {
                o.write(t.dico.msg.command.usage, m, sub(q, m, null, t));
            } else if (sub) for (let k in sub) unpack(sub[k]);
        };
        unpack(targetComm);
        o.send();
    },
    detail: {
        chara: function (q, m, o, t) {
            if (!o) return q.toDicoLang("detail chara _name_", t.dico.c);
            q.select('Charas', { name: m }).then(r => o.send(t.dico.on.detail.chara, r[0].name));
        },
        place: function (q, m, o, t) {
            if (!o) return q.toDicoLang("detail place _name_", t.dico.c);
            q.select('Places', { name: m }).then(r => o.send(t.dico.on.detail.place, r[0].name));
        },
        item: function (q, m, o, t) {
            if (!o) return q.toDicoLang("detail item _name_", t.dico.c);
            q.select('Items', { name: m }).then(r => o.send(t.dico.on.detail.item, r[0].name));
        },
        alias: function (q, m, o, t) {
            if (!o) return q.toDicoLang("detail alias _name_", t.dico.c);
            q.select('Alias', { key: m }).then(r => o.send(t.dico.on.detail.alias, r[0].key, r[0].value));
        },
        script: function (q, m, o, t) {
            if (!o) return q.toDicoLang("detail script _name_", t.dico.c);
            q.select('Scripts', { name: m }).then(r => o.send(t.dico.on.detail.script, r[0].name, r[0].trigger, r[0].action));
        },
        all: {
            charas: function (q, m, o, t) {
                if (!o) return q.toDicoLang("detail all charas", t.dico.c);
                q.select('Charas').then(r => r.length ? r.forEach(v => o.write(t.dico.on.detail.all.charas, v.name)) + o.send() : o.send(t.dico.on.detail.all.empty));
            },
            places: function (q, m, o, t) {
                if (!o) return q.toDicoLang("detail all places", t.dico.c);
                q.select('Places').then(r => r.length ? r.forEach(v => o.write(t.dico.on.detail.all.places, v.name)) + o.send() : o.send(t.dico.on.detail.all.empty));
            },
            items: function (q, m, o, t) {
                if (!o) return q.toDicoLang("detail all items", t.dico.c);
                q.select('Items').then(r => r.length ? r.forEach(v => o.write(t.dico.on.detail.all.items, v.name)) + o.send() : o.send(t.dico.on.detail.all.empty));
            },
            alias: function (q, m, o, t) {
                if (!o) return q.toDicoLang("detail all alias", t.dico.c);
                q.select('Alias').then(r => r.length ? r.forEach(v => o.write(t.dico.on.detail.all.alias, v.key, v.value)) + o.send() : o.send(t.dico.on.detail.all.empty));
            },
            scripts: function (q, m, o, t) {
                if (!o) return q.toDicoLang("detail all scripts", t.dico.c);
                q.select('Scripts').then(r => r.length ? r.forEach(v => o.write(t.dico.on.detail.all.scripts, v.name, v.trigger, v.action)) + o.send() : o.send(t.dico.on.detail.all.empty));
            }
        },
        everything: function (q, m, o, t) {
            if (!o) return q.toDicoLang("detail everything", t.dico.c);
            q.select('Charas').then(r => r.length ? r.forEach(v => o.write(t.dico.on.detail.all.charas, v.name)) + o.send() : o.send(t.dico.on.detail.all.empty));
            q.select('Places').then(r => r.length ? r.forEach(v => o.write(t.dico.on.detail.all.places, v.name)) + o.send() : o.send(t.dico.on.detail.all.empty));
            q.select('Items').then(r => r.length ? r.forEach(v => o.write(t.dico.on.detail.all.items, v.name)) + o.send() : o.send(t.dico.on.detail.all.empty));
            q.select('Alias').then(r => r.length ? r.forEach(v => o.write(t.dico.on.detail.all.alias, v.key, v.value)) + o.send() : o.send(t.dico.on.detail.all.empty));
            q.select('Scripts').then(r => r.length ? r.forEach(v => o.write(t.dico.on.detail.all.scripts, v.name, v.trigger, v.action)) + o.send() : o.send(t.dico.on.detail.all.empty));
        }
    },
    create: {
        chara: function (q, m, o, t) {
            if (!o) return q.toDicoLang("create chara _name_", t.dico.c);
            q.insert('Charas', { name: m }).then(() => o.send(t.dico.on.create.chara, m));
        },
        place: function (q, m, o, t) {
            if (!o) return q.toDicoLang("create place _name_", t.dico.c);
            q.insert('Places', { name: m }).then(() => o.send(t.dico.on.create.place, m));
        },
        item: function (q, m, o, t) {
            if (!o) return q.toDicoLang(`create item _nb_${t.dico.sep.nb}_name_`, t.dico.c);

            let nb_item = q.splitOnce(m, t.dico.sep.nb);

            let itemName = nb_item[1];
            let nb = nb_item[0];

            q.select('Items', { name: itemName }).then(rows => {
                let item = rows[0];

                if (!item) {
                    q.insert('Items', { name: itemName, total: nb, left: nb }).then(
                        () => o.send(t.dico.on.create.item.new, nb, itemName)
                    );
                } else {
                    q.update('Items', { name: item.name }, { total: item.total + nb, left: item.left + nb }).then(
                        () => o.send(t.dico.on.create.item.old, item.total + nb, item.name)
                    );
                }
            })
        },
        alias: function (q, m, o, t) {
            if (!o) return q.toDicoLang(`create alias _key_${t.dico.sep.alias}_value_`, t.dico.c);

            let key_value = q.splitOnce(m, t.dico.sep.alias);
            t.alias[key_value[0]] = key_value[1];
            q.insert('Alias', { key: key_value[0], value: key_value[1] }).then(
                () => o.send(t.dico.on.create.alias, key_value[0], key_value[1])
            );
        },
        script: function (q, m, o, t) {
            if (!o) return q.toDicoLang(`create script _name_${t.dico.sep.script.action}_action_[${t.dico.sep.script.trigger}_trigger_]`, t.dico.c);

            let name_value = q.splitOnce(m, t.dico.sep.script.action);
            let action_trigger = q.splitOnce(name_value[1], t.dico.sep.script.trigger);

            let name = name_value[0];
            let trigger = action_trigger[1] || "using";
            let action = action_trigger[0];

            q.insert('Scripts', { name: name, trigger: trigger, action: action }).then(
                () => o.send(t.dico.on.create.script, name, trigger, action)
            );
        }
    },
    edit: {
        chara: {
            desc: function (q, m, o, t) {
                if (!o) return q.toDicoLang(`edit chara desc _name_${t.dico.sep.desc}_desc_`, t.dico.c);

                let name_desc = q.splitOnce(m, t.dico.sep.desc);
                q.update('Charas', { name: name_desc[0] }, { desc: name_desc[1] }).then(() => o.send(t.dico.on.edit.chara, name_desc[0]));
            }
        },
        place: {
            desc: function (q, m, o, t) {
                if (!o) return q.toDicoLang(`edit place desc _name_${t.dico.sep.desc}_desc_`, t.dico.c);

                let name_desc = q.splitOnce(m, t.dico.sep.desc);
                q.update('Places', { name: name_desc[0] }, { desc: name_desc[1] }).then(() => o.send(t.dico.on.edit.place, name_desc[0]));
            }
        },
        item: {
            desc: function (q, m, o, t) {
                if (!o) return q.toDicoLang(`edit item desc _name_${t.dico.sep.desc}_desc_`, t.dico.c);

                let name_desc = q.splitOnce(m, t.dico.sep.desc);
                q.update('Items', { name: name_desc[0] }, { desc: name_desc[1] }).then(() => o.send(t.dico.on.edit.item, name_desc[0]));
            }
        },
        alias: function (q, m, o, t) {
            if (!o) return q.toDicoLang(`edit alias _key_${t.dico.sep.alias}_value_`, t.dico.c);

            let key_value = q.splitOnce(m, t.dico.sep.alias);
            t.alias[key_value[0]] = key_value[1];
            q.update('Alias', { key: key_value[0] }, { value: key_value[1] }).then(() => o.send(t.dico.on.edit.alias, key_value[0], key_value[1]));
        },
        script: function (q, m, o, t) {
            if (!o) return q.toDicoLang(`edit script _name_${t.dico.sep.script.action}_action_[${t.dico.sep.script.trigger}_trigger_]`, t.dico.c);

            let name_value = q.splitOnce(m, t.dico.sep.script.action);
            let action_trigger = q.splitOnce(name_value[1], t.dico.sep.script.trigger);

            let name = name_value[0];
            let trigger = action_trigger[1] || "using";
            let action = action_trigger[0];

            q.update('Scripts', { name: name }, { trigger: trigger, action: action }).then(() => o.send(t.dico.on.edit.script));
        }
    },
    remove: {
        chara: function (q, m, o, t) {
            if (!o) return q.toDicoLang("remove chara _name_", t.dico.c);

            q.delete('Charas', { name: m }).then(() => o.send(t.dico.on.remove.chara, m));
        },
        place: function (q, m, o, t) {
            if (!o) return q.toDicoLang("remove place _name_", t.dico.c);

            q.delete('Places', { name: m }).then(() => o.send(t.dico.on.remove.place, m));
        },
        item: function (q, m, o, t) {
            if (!o) return q.toDicoLang(`remove item [_nb_${t.dico.sep.nb}]_name_`, t.dico.c);

            let nb_item = q.splitOnce(m, t.dico.sep.nb);

            let itemName = nb_item[1];
            let nb = nb_item[0];

            if (!itemName) {
                q.delete('Items', { name: nb }).then(() => o.send(t.dico.on.remove.item, "N", nb));
            } else {
                q.select('Items', { name: itemName }).then(rows => {
                    let item = rows[0];

                    if (!item) {
                    } else {
                        if (nb < this.item.count) {
                            q.update('Items', { name: item.name }, { count: item.count - nb }).then(() => o.send(t.dico.on.remove.item, nb, itemName));
                        } else {
                            q.delete('Items', { name: item.name }).then(() => o.send(t.dico.on.remove.item, item.count, itemName));
                        }
                    }
                });
            }
        },
        alias: function (q, m, o, t) {
            if (!o) return q.toDicoLang("remove alias _key_", t.dico.c);

            delete t.alias[m];
            q.delete('Alias', { key: m }).then(() => o.send(t.dico.on.remove.alias, m));
        },
        script: function (q, m, o, t) {
            if (!o) return q.toDicoLang("remove script _name_", t.dico.c);

            q.delete('Scripts', { name: m }).then(() => o.send(t.dico.on.remove.script, m));
        },
        all: {
            charas: function (q, m, o, t) {
                if (!o) return q.toDicoLang("remove all charas", t.dico.c);
                q.delete('Charas').then(() => o.send(t.dico.on.remove.all.charas));
            },
            places: function (q, m, o, t) {
                if (!o) return q.toDicoLang("remove all places", t.dico.c);
                q.delete('Places').then(() => o.send(t.dico.on.remove.all.places));
            },
            items: function (q, m, o, t) {
                if (!o) return q.toDicoLang("remove all items", t.dico.c);
                q.delete('Items').then(() => o.send(t.dico.on.remove.all.items));
            },
            alias: function (q, m, o, t) {
                if (!o) return q.toDicoLang("remove all alias", t.dico.c);
                q.delete('Alias').then(() => o.send(t.dico.on.remove.all.alias)); // TODO: remove from `this.alias` (update it)
            },
            scripts: function (q, m, o, t) {
                if (!o) return q.toDicoLang("remove all scripts", t.dico.c);
                q.delete('Scripts').then(() => o.send(t.dico.on.remove.all.scripts));
            }
        },
        everything: function (q, m, o, t) { // TODO: chain `then`s?
            if (!o) return q.toDicoLang("remove everything", t.dico.c);
            q.delete('Charas').then(() => o.send(t.dico.on.remove.all.charas));
            q.delete('Places').then(() => o.send(t.dico.on.remove.all.places));
            q.delete('Items').then(() => o.send(t.dico.on.remove.all.items));
            q.delete('Alias').then(() => o.send(t.dico.on.remove.all.alias)); // TODO: remove from `this.alias` (update it)
            q.delete('Scripts').then(() => o.send(t.dico.on.remove.all.scripts));
            o.send(t.dico.on.remove.everything);
        }
    },
    give: function (q, m, o, t) {
        if (!o) return q.toDicoLang(`give [_nb_${t.dico.sep.nb}]_item name_${t.dico.sep.give}_chara name_`, t.dico.c);

        let value_chara = q.splitOnce(m, t.dico.sep.give);
        let nb_item = q.splitOnce(value_chara[0], t.dico.sep.nb);

        let itemName = nb_item[1];
        let nb = nb_item[0];
        let charaName = value_chara[1];

        if (!itemName) {
            itemName = nb;
            nb = "1";
        }

        q.select('Item', { name: itemName }).then(rows1 => {
            let item = rows1[0];
            q.select('Charas', { name: charaName }).then(rows2 => {
                let chara = rows2[0];
                q.select('Have', { chara: chara.name, item: item.name }).then(rows3 => {
                    let have = rows3[0];
                    if (item.left < nb) nb = item.left;

                    if (!have) {
                        q.insert('Have', { chara: chara.name, item: item.name, count: nb });
                        o.send(t.dico.on.give.new, chara.name, nb, item.name);
                    } else {
                        q.update('Have', { chara: chara.name, item: item.name }, { count: nb + have.count });
                        o.send(chara.name + " now have " + (nb + have.count) + "x " + item.name + ".");
                        o.send(t.dico.on.give.old, chara.name, (nb + have.count), item.name);
                    }

                    q.update('Items', { name: item.name }, { left: item.left - nb }).then(
                        () => o.send(t.dico.on.detail.item, item.left - nb, item.name) // TODO: update values list
                    )
                });
            });
        });
    },
    take: function (q, m, o, t) {
        if (!o) return q.toDicoLang(`take [_nb_${t.dico.sep.nb}]_item name_${t.dico.sep.give}_chara name_`, t.dico.c);

        this.commands.give(q, "-" + m.replace(t.dico.sep.take, t.dico.sep.give), o, d, a); // TODO: properly
    },
    move: function (q, m, o, t) {
        if (!o) return q.toDicoLang(`move _chara name_${t.dico.sep.move}_place name_`, t.dico.c);

        let chara_place = q.splitOnce(m, t.dico.sep.move);

        let charaName = chara_place[0];
        let placeName = chara_place[1];

        q.select('Places', { name: placeName }).then(rows2 => {
            let place = rows2[0];
            q.update('Charas', { name: charaName }, { place: place.name }).then(
                () => o.send(t.dico.on.move.new, charaName, place.name)
            );
        });
    },
    script: function (q, m, o, t) {
        if (!o) return q.toDicoLang(`script _object name_${t.dico.sep.script.affect}_script name_`, t.dico.c);

        let object_script = q.splitOnce(m, t.dico.sep.script.affect);
        q.insert('Do', { script: object_script[1], object: object_script[0] }).then(() => o.send(t.dico.on.script, object_script[1], object_script[0]));
    },
    unscript: function (q, m, o, t) {
        if (!o) return q.toDicoLang(`unscript _object name_${t.dico.sep.script.affect}_script name_`, t.dico.c);

        let object_script = q.splitOnce(m, t.dico.sep.script.affect);
        q.delete('Do', { script: object_script[1], object: object_script[0] }).then(() => o.send(t.dico.on.script, object_script[1], object_script[0]));
    },
    execute: function (q, m, o, t) {
        if (!o) return q.toDicoLang(`execute _script name_`, t.dico.c);
        q.select('Scripts', { name: m }).then(rows => t.exec(rows[0].action));
    }
};

/*-*/
