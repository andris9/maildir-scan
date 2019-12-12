'use strict';

const MaildirScan = require('../lib/maildir-scan');

module.exports.recursiveFolderScan = test => {
    let scanner = new MaildirScan();
    scanner.recursiveFolderScan(__dirname + '/fixtures/box1/Maildir', false, 0, (err, output) => {
        test.ifError(err);
        test.deepEqual(output, [
            {
                name: '.Drafts',
                path: '.Drafts',
                dir: true,
                children: [{ name: 'courierimapacl', path: '.Drafts/courierimapacl', file: true }]
            },
            {
                name: '.R&AOQ-mpspost.T&AOQ-htis',
                path: '.R&AOQ-mpspost.T&AOQ-htis',
                dir: true,
                children: [
                    { name: 'courierimapacl', path: '.R&AOQ-mpspost.T&AOQ-htis/courierimapacl', file: true },
                    {
                        name: 'courierimapkeywords',
                        path: '.R&AOQ-mpspost.T&AOQ-htis/courierimapkeywords',
                        dir: true,
                        children: [
                            { name: ':list', path: '.R&AOQ-mpspost.T&AOQ-htis/courierimapkeywords/:list', file: true },
                            {
                                name: '.5017661.1505297645.M902486P6469V000000000000FC00I0000000000043284_2.ubuntu,S=7',
                                path:
                                    '.R&AOQ-mpspost.T&AOQ-htis/courierimapkeywords/.5017661.1505297645.M902486P6469V000000000000FC00I0000000000043284_2.ubuntu,S=7',
                                file: true
                            },
                            {
                                name: '1505298136.M631733P6523V000000000000FC00I000000000004796C_0.ubuntu,S=11',
                                path: '.R&AOQ-mpspost.T&AOQ-htis/courierimapkeywords/1505298136.M631733P6523V000000000000FC00I000000000004796C_0.ubuntu,S=11',
                                file: true
                            }
                        ]
                    },
                    { name: 'courierimapuiddb', path: '.R&AOQ-mpspost.T&AOQ-htis/courierimapuiddb', file: true },
                    {
                        name: 'cur',
                        path: '.R&AOQ-mpspost.T&AOQ-htis/cur',
                        dir: true,
                        children: [
                            {
                                name: '1505297612.M848220P6469V000000000000FC00I0000000000042F63_0.ubuntu,S=6:2,S',
                                path: '.R&AOQ-mpspost.T&AOQ-htis/cur/1505297612.M848220P6469V000000000000FC00I0000000000042F63_0.ubuntu,S=6:2,S',
                                file: true
                            },
                            {
                                name: '1505297634.M393426P6469V000000000000FC00I0000000000043267_1.ubuntu,S=7:2,',
                                path: '.R&AOQ-mpspost.T&AOQ-htis/cur/1505297634.M393426P6469V000000000000FC00I0000000000043267_1.ubuntu,S=7:2,',
                                file: true
                            },
                            {
                                name: '1505297645.M902486P6469V000000000000FC00I0000000000043284_2.ubuntu,S=7:2,F',
                                path: '.R&AOQ-mpspost.T&AOQ-htis/cur/1505297645.M902486P6469V000000000000FC00I0000000000043284_2.ubuntu,S=7:2,F',
                                file: true
                            },
                            {
                                name: '1505298136.M631733P6523V000000000000FC00I000000000004796C_0.ubuntu,S=11:2,DFS',
                                path: '.R&AOQ-mpspost.T&AOQ-htis/cur/1505298136.M631733P6523V000000000000FC00I000000000004796C_0.ubuntu,S=11:2,DFS',
                                file: true
                            }
                        ]
                    },
                    { name: 'maildirfolder', path: '.R&AOQ-mpspost.T&AOQ-htis/maildirfolder', file: true }
                ]
            },
            {
                name: '.Sent',
                path: '.Sent',
                dir: true,
                children: [{ name: 'courierimapacl', path: '.Sent/courierimapacl', file: true }]
            },
            {
                name: '.Templates',
                path: '.Templates',
                dir: true,
                children: [{ name: 'courierimapacl', path: '.Templates/courierimapacl', file: true }]
            },
            {
                name: '.Trash',
                path: '.Trash',
                dir: true,
                children: [{ name: 'courierimapacl', path: '.Trash/courierimapacl', file: true }]
            },
            {
                name: 'courierimaphieracl',
                path: 'courierimaphieracl',
                dir: true,
                children: [{ name: 'R&AOQ-mpspost', path: 'courierimaphieracl/R&AOQ-mpspost', file: true }]
            },
            { name: 'courierimapuiddb', path: 'courierimapuiddb', file: true },
            { name: 'cur', path: 'cur', dir: true, children: [{ name: 'random.name', path: 'cur/random.name', file: true }] },
            {
                name: 'new',
                path: 'new',
                dir: true,
                children: [
                    {
                        name: '1505297736.Z810083P6469V000000000000FC00I0000000000044B99_3.ubuntu,S=9',
                        path: 'new/1505297736.Z810083P6469V000000000000FC00I0000000000044B99_3.ubuntu,S=9',
                        file: true
                    }
                ]
            }
        ]);
        test.done();
    });
};

module.exports.scan = test => {
    let scanner = new MaildirScan();
    scanner.scan(__dirname + '/fixtures/box1/Maildir', (err, output) => {
        test.ifError(err);
        test.deepEqual(output, [
            {
                folder: ['INBOX'],
                name: 'INBOX',
                path: '.',
                messages: [
                    { name: 'random.name', path: 'cur/random.name', time: 1505991694, flags: [] },
                    {
                        name: '1505297736.Z810083P6469V000000000000FC00I0000000000044B99_3.ubuntu,S=9',
                        path: 'new/1505297736.Z810083P6469V000000000000FC00I0000000000044B99_3.ubuntu,S=9',
                        time: 1505297736,
                        flags: []
                    }
                ]
            },
            {
                folder: ['Rämpspost', 'Tähtis'],
                name: '.R&AOQ-mpspost.T&AOQ-htis',
                path: '.R&AOQ-mpspost.T&AOQ-htis',
                messages: [
                    {
                        name: '1505297612.M848220P6469V000000000000FC00I0000000000042F63_0.ubuntu,S=6:2,S',
                        path: '.R&AOQ-mpspost.T&AOQ-htis/cur/1505297612.M848220P6469V000000000000FC00I0000000000042F63_0.ubuntu,S=6:2,S',
                        time: 1505297612,
                        flags: ['\\Seen']
                    },
                    {
                        name: '1505297634.M393426P6469V000000000000FC00I0000000000043267_1.ubuntu,S=7:2,',
                        path: '.R&AOQ-mpspost.T&AOQ-htis/cur/1505297634.M393426P6469V000000000000FC00I0000000000043267_1.ubuntu,S=7:2,',
                        time: 1505297634,
                        flags: []
                    },
                    {
                        name: '1505297645.M902486P6469V000000000000FC00I0000000000043284_2.ubuntu,S=7:2,F',
                        path: '.R&AOQ-mpspost.T&AOQ-htis/cur/1505297645.M902486P6469V000000000000FC00I0000000000043284_2.ubuntu,S=7:2,F',
                        time: 1505297645,
                        flags: ['\\Flagged', 'gupi', 'jupi']
                    },
                    {
                        name: '1505298136.M631733P6523V000000000000FC00I000000000004796C_0.ubuntu,S=11:2,DFS',
                        path: '.R&AOQ-mpspost.T&AOQ-htis/cur/1505298136.M631733P6523V000000000000FC00I000000000004796C_0.ubuntu,S=11:2,DFS',
                        time: 1505298136,
                        flags: ['\\Draft', '\\Flagged', '\\Seen', 'jupi', 'kupi', 'mupi']
                    }
                ]
            }
        ]);
        test.done();
    });
};
