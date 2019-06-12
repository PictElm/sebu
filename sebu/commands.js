module.exports = {
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
        script: function (q, m, o, d, a) {
            q.select('Scripts', { name: m }).then(r => o.send(d.on.detail.script, r[0].name, r[0].trigger, r[0].action));
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
            },
            scripts: function (q, m, o, d, a) {
                q.select('Scripts').then(r => r.length ? r.forEach(v => o.write(d.on.detail.all.scripts, v.name, v.trigger, v.action)) + o.send() : o.send(d.on.detail.all.empty));
            }
        },
        everything: function (q, m, o, d, a) {
            q.select('Charas').then(r => r.length ? r.forEach(v => o.write(d.on.detail.all.charas, v.name)) + o.send() : o.send(d.on.detail.all.empty));
            q.select('Places').then(r => r.length ? r.forEach(v => o.write(d.on.detail.all.places, v.name)) + o.send() : o.send(d.on.detail.all.empty));
            q.select('Items').then(r => r.length ? r.forEach(v => o.write(d.on.detail.all.items, v.name)) + o.send() : o.send(d.on.detail.all.empty));
            q.select('Alias').then(r => r.length ? r.forEach(v => o.write(d.on.detail.all.alias, v.key, v.value)) + o.send() : o.send(d.on.detail.all.empty));
            q.select('Scripts').then(r => r.length ? r.forEach(v => o.write(d.on.detail.all.scripts, v.name, v.trigger, v.action)) + o.send() : o.send(d.on.detail.all.empty));
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
            let nb_item = q.splitOnce(m, d.sep);

            let itemName = nb_item[1];
            let nb = nb_item[0];

            q.select('Items', { name: itemName }).then(rows => {
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
            let key_value = q.splitOnce(m, d.sep.alias);
            a[key_value[0]] = key_value[1];
            q.insert('Alias', { key: key_value[0], value: key_value[1] }).then(
                () => o.send(d.on.create.alias, key_value[0], key_value[1])
            );
        },
        script: function (q, m, o, d, a) {
            let name_value = q.splitOnce(m, d.sep.script.action);
            let action_trigger = q.splitOnce(name_value[1], d.sep.script.trigger);

            let name = name_value[0];
            let trigger = action_trigger[1];
            let action = action_trigger[0];

            q.insert('Scripts', { name: name, trigger: trigger, action: action }).then(
                () => o.send(d.on.create.script, name, trigger, action)
            );
        }
    },
    edit: {
        chara: {
            desc: function (q, m, o, d, a) {
                let name_desc = q.splitOnce(m, d.sep.desc);
                q.update('Charas', { name: name_desc[0] }, { desc: name_desc[1] }).then(() => o.send(d.on.edit.chara, name_desc[0]));
            }
        },
        place: {
            desc: function (q, m, o, d, a) {
                let name_desc = q.splitOnce(m, d.sep.desc);
                q.update('Places', { name: name_desc[0] }, { desc: name_desc[1] }).then(() => o.send(d.on.edit.place, name_desc[0]));
            }
        },
        item: {
            desc: function (q, m, o, d, a) {
                let name_desc = q.splitOnce(m, d.sep.desc);
                q.update('Items', { name: name_desc[0] }, { desc: name_desc[1] }).then(() => o.send(d.on.edit.item, name_desc[0]));
            }
        },
        alias: function (q, m, o, d, a) {
            let key_value = q.splitOnce(m, d.sep.alias);
            a[key_value[0]] = key_value[1];
            q.update('Alias', { key: key_value[0] }, { value: key_value[1] }).then(() => o.send(d.on.edit.alias, key_value[0], key_value[1]));
        },
        script: function (q, m, o, d, a) {
            let name_value = q.splitOnce(m, d.sep.script.action);
            let action_trigger = q.splitOnce(name_value[1], d.sep.script.trigger);

            let name = name_value[0];
            let trigger = action_trigger[1];
            let action = action_trigger[0];

            q.update('Scripts', { name: name }, { trigger: trigger, action: action }).then(() => o.send(d.on.edit.script));
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
            let nb_item = q.splitOnce(m, d.sep.nb);

            let itemName = nb_item[1];
            let nb = nb_item[0];

            q.select('Items', { name: itemName }).then(rows => {
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
            q.delete('Alias', { key: m }).then(() => o.send(d.on.remove.alias, m));
        },
        script: function (q, m, o, d, a) {
            q.delete('Scripts', { name: m }).then(() => o.send(d.on.remove.script, m));
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
            },
            scripts: function (q, m, o, d, a) {
                q.delete('Scripts').then(() => o.send(d.on.remove.all.scripts));
            }
        },
        everything: function (q, m, o, d, a) {
            q.delete('Charas').then(() => o.send(d.on.remove.all.charas));
            q.delete('Places').then(() => o.send(d.on.remove.all.places));
            q.delete('Items').then(() => o.send(d.on.remove.all.items));
            q.delete('Alias').then(() => o.send(d.on.remove.all.alias)); // TODO: remove from this.alias
            q.delete('Scripts').then(() => o.send(d.on.remove.all.scripts));
            o.send(d.on.remove.everything);
        }
    },
    give: function (q, m, o, d, a) {
        let item_chara = q.splitOnce(m, d.sep.give);
        let nb_item = q.splitOnce(item_chara[0], d.sep.item);

        let itemName = nb_item[1];
        let nb = nb_item[0];
        let charaName = item_chara[1];

        q.select('Item', { name: itemName }).then(rows1 => {
            let item = rows1[0];
            q.select('Charas', { name: charaName }).then(rows2 => {
                let chara = rows2[0];
                q.select('Have', { chara: chara.name, item: item.name }).then(rows3 => {
                    let have = rows3[0];
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
            });
        });
    },
    take: function (q, m, o, d, a) {
        this.commands.give(q, "-" + m, o, d, a); // TODO: properly
    },
    move: function (q, m, o, d, a) {
        let chara_place = q.splitOnce(m, d.sep.move);

        let charaName = chara_place[0];
        let placeName = chara_place[1];

        q.select('Charas', { name: charaName }).then(rows1 => {
            let chara = rows1[0];
            q.select('Places', { name: placeName }).then(rows2 => {
                let place = rows2[0];
                q.update('Charas', { name: chara.name }, { place: place.name }).then(
                    () => o.send(d.on.move.new, chara.name, place.name)
                );
            });
        });
    },
    script: function(q, m, o, d, a) {
        let object_name = q.splitOnce(m, d.sep.script.affect);
        q.insert('Do', { script: object_name[1], object: object_name[0] }).then(() => o.send(d.on.script, object_name[1], object_name[0]));
    },
    unscript: function(q, m, o, d, a) {
        let object_name = q.splitOnce(m, d.sep.script.affect);
        q.delete('Do', { script: object_name[1], object: object_name[0] }).then(() => o.send(d.on.script, object_name[1], object_name[0]));
    }
};

/*-*/
