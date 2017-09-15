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
            this.scanPrepared(maildirPath, dir, callback);
        });
    }

    scanPrepared(maildirPath, dir, callback) {
        let root = {
            name: 'INBOX',
            path: '.',
            dir: true,
            children: dir
        };

        let mailboxes = [];

        let walk = (parent, entry, next) => {
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

                if (folder.name === 'courierimapkeywords') {
                    parent.keywords = folder.keywords = new Map();
                    folder.checkKeywords = true;
                } else if (['cur', 'new', 'tmp'].includes(folder.name)) {
                    parent.maildir = true;
                    folder = parent;
                } else {
                    mailboxes.push(folder);
                }

                let entryPos = 0;
                let processEntry = () => {
                    if (entryPos >= entry.children.length) {
                        return next();
                    }
                    let child = entry.children[entryPos++];
                    walk(folder, child, () => setImmediate(processEntry));
                };

                return setImmediate(processEntry);
            }

            if (entry.file && (entry.name.indexOf(':2') >= 0 || entry.name.indexOf('S=') >= 0)) {
                if (parent.checkKeywords) {
                    return fs.readFile(pathlib.join(maildirPath, entry.path), 'utf-8', (err, keywords) => {
                        if (err) {
                            // ignore
                        } else {
                            keywords = (keywords || '')
                                .toString()
                                .replace(/[\r\n]+/g, '\n')
                                .trim()
                                .split('\n')
                                .filter(kw => kw);
                            if (keywords.length) {
                                parent.keywords.set(entry.name.replace(/^\.[^.]+\./, ''), keywords);
                            }
                        }
                        return next();
                    });
                }
                let parsed = this.parseFile(entry);
                if (parsed) {
                    parent.messages.push(parsed);
                }
                return next();
            }

            return next();
        };

        walk(false, root, () => {
            let specialUse = new Set();

            mailboxes = mailboxes
                .map(folder => {
                    // push custom keywords to message flags
                    if (folder.keywords && folder.keywords.size && folder.messages && folder.messages.length) {
                        folder.messages.forEach(msg => {
                            let customFlags = folder.keywords.get(msg.name.split(':2')[0]);
                            if (customFlags) {
                                let existingFlags = msg.flags.map(fl => fl.toLowerCase().trim());
                                customFlags.forEach(fl => {
                                    let flC = fl.toLowerCase().trim();
                                    if (!existingFlags.includes(flC)) {
                                        existingFlags.push(flC);
                                        msg.flags.push(fl);
                                    }
                                });
                            }
                        });
                    }
                    return folder;
                })
                .filter(folder => folder.maildir && folder.messages.length)
                .map(folder => {
                    delete folder.keywords;
                    delete folder.maildir;
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
            base = entry.name;
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
