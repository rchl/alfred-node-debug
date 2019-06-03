'use strict';

const alfy = require('alfy');
const psList = require('ps-list');
const pidFromPort = require('pid-from-port');
const util = require('./lib/util');

const loadProcesses = () => {
    if (alfy.input.startsWith(':')) {
        const search = alfy.input.slice(1);

        return Promise.all([
            pidFromPort.list(),
            psList({all: false})
        ]).then(result => {
            const ports = result[0];
            const processList = result[1];

            // Swap port and pid
            const pidMap = new Map();
            for (const entry of ports.entries()) {
                const port = String(entry[0]);

                if (!port.includes(search)) {
                    // Filter out results which don't match the search term
                    continue;
                }

                pidMap.set(entry[1], String(entry[0]));
            }

            return processList
                .map(proc => Object.assign({}, proc, {port: pidMap.get(proc.pid)}))
                .filter(proc => Boolean(proc.port) && proc.pid !== process.pid);
        });
    }

    return psList().then(data => alfy.inputMatches(data, 'name'));
};

loadProcesses()
    .then(processes => {
        const items = processes
            .filter(proc => !proc.name.endsWith(' Helper'))
            .map(proc => {
                const cleanedPath = proc.cmd.replace(/\.app\/Contents\/.*$/, '.app');

                // TODO: Use the `proc.path` property in `ps-list` when implemented there
                // The below can be removed then
                const pathForIcon = cleanedPath.replace(/ -.*/, ''); // Removes arguments

                let subtitle = cleanedPath;

                if (proc.port) {
                    // TODO; Use `proc.path` property
                    subtitle = `${proc.port} - ${subtitle}`;
                }

                return {
                    title: proc.name,
                    autocomplete: proc.name,
                    subtitle,
                    arg: proc.pid,
                    icon: {
                        type: 'fileicon',
                        path: pathForIcon
                    },
                    mods: {
                        shift: {
                            subtitle: `CPU ${proc.cpu}%`
                        },
                    }
                };
            })
            .sort(util.sorter);

        alfy.output(items);
    });
