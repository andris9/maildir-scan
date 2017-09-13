'use strict';

const fs = require('fs');
const pathlib = require('path');
const utf7 = require('utf7').imap;
const specialUseBoxes = require('./special-use-boxes');

class MaildirScan {
    constructor(options) {
        this.options = options || {};
    }

    scan(maildirPath, callback) {
        this.recursiveFolderScan(maildirPath, false, 0, (err, dir) => {
            if (err) {
                return callback(err);
            }

            let root = {
                folder: ['INBOX'],
                name: 'INBOX',
                path: '.',
                messages: []
            };

            let mailboxes = [root];

            let walk = (parent, entry) => {
                if (entry.dir) {
                    let nameParts = entry.name
                        .split('.')
                        .map(part => utf7.decode(part.trim()))
                        .filter(part => part.trim());
                    let folder = {
                        folder: nameParts,
                        name: entry.name,
                        path: entry.path,
                        messages: []
                    };

                    if (['cur', 'new', 'tmp'].includes(folder.name)) {
                        parent.maildir = true;
                        folder = parent;
                    } else {
                        mailboxes.push(folder);
                    }

                    entry.children.forEach(child => walk(folder, child));
                }

                if (entry.file && entry.name.indexOf(':2') >= 0) {
                    let parsed = this.parseFile(entry);
                    if (parsed) {
                        parent.messages.push(parsed);
                    }
                }
            };

            dir.forEach(entry => walk(root, entry));

            let specialUse = new Set();

            mailboxes = mailboxes.filter(folder => folder.maildir && folder.messages.length).map(folder => {
                let fname = folder.folder[folder.folder.length - 1];
                if (fname !== 'INBOX') {
                    let su = specialUseBoxes(fname);
                    if (su && !specialUse.has(su)) {
                        folder.specialUse = su;
                        specialUse.add(su);
                    }
                }
                return folder;
            });

            callback(null, mailboxes);
        });
    }

    parseFile(entry) {
        let base;
        let tail;
        let flags = [];
        let cflags = [];
        if (/:2,?$/.test(entry.name)) {
            base = entry.name.split(/:2,?/).shift();
        } else if (/:2,/.test(entry.name)) {
            let parts = entry.name.split(':2,');
            base = parts.shift();
            tail = parts.join(':2,');
            for (let i = 0, len = tail.length; i < len; i++) {
                let chr = tail.charAt(i);
                switch (chr) {
                    case 'P':
                        flags.push('$Forwarded');
                        break;
                    case 'R':
                        flags.push('\\Answered');
                        break;
                    case 'S':
                        flags.push('\\Seen');
                        break;
                    case 'T':
                        flags.push('\\Deleted');
                        break;
                    case 'D':
                        flags.push('\\Draft');
                        break;
                    case 'F':
                        flags.push('\\Flagged');
                        break;
                    default:
                        if (/[a-z]/i.test(chr)) {
                            cflags.push(chr);
                        }
                }
            }
        } else {
            return false;
        }

        let parts = base.split('.');
        if (!parts[0]) {
            parts.splice(0, 2);
        }
        let time = Number(parts.shift()) || 0;
        if (!time) {
            return false;
        }

        return {
            name: entry.name,
            path: entry.path,
            time,
            flags //,
            //cflags
        };
    }

    recursiveFolderScan(basepath, path, level, callback) {
        level = level || 0;

        if (!path) {
            path = basepath;
        }

        fs.readdir(path, { encoding: 'utf8' }, (err, list) => {
            if (err) {
                return callback(err);
            }

            let output = [];
            list = list || [];
            let pos = 0;
            let processList = () => {
                if (pos >= list.length) {
                    output = output.sort((a, b) => a.name.localeCompare(b.name));
                    return callback(null, output);
                }

                let name = list[pos++];
                if (!name || ['.', '..'].includes(name)) {
                    return setImmediate(processList);
                }

                let realpath = pathlib.join(path, name);
                let entry = {
                    name,
                    path: pathlib.relative(basepath, realpath)
                };

                fs.stat(realpath, (err, stat) => {
                    if (err) {
                        entry.error = err.message;
                        output.push(entry);
                        return setImmediate(processList);
                    }

                    if (stat.isFile()) {
                        entry.file = true;
                        output.push(entry);
                        return setImmediate(processList);
                    }

                    if (stat.isDirectory()) {
                        entry.dir = true;
                        if (level > 128) {
                            entry.children = [];
                            entry.status = 'EMAXLEVEL';
                            output.push(entry);
                            return setImmediate(processList);
                        }
                        this.recursiveFolderScan(basepath, realpath, level + 1, (err, children) => {
                            if (err) {
                                return callback(err);
                            }
                            entry.children = children;
                            output.push(entry);
                            return setImmediate(processList);
                        });
                        return;
                    }

                    // unknown
                    return setImmediate(processList);
                });
            };

            setImmediate(processList);
        });
    }
}

module.exports = MaildirScan;
