'use strict';

const treeKill = require('tree-kill');

treeKill(Number.parseInt(process.argv[2]), 'SIGUSR1');
