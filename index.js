'use strict';

const alfy = require('alfy');
const os = require('os');
const psList = require('ps-list');
const pidFromPort = require('pid-from-port');
const util = require('./lib/util');

const WORKFLOW_ID = '81F6B074-F56F-496C-BE12-3756E6898E2A'
const HOMEDIR_RE = new RegExp(os.homedir(), 'g');

async function main() {
    const processes = (await psList({ all: false }))
        // .filter(proc => !proc.name.endsWith(' Helper') && proc.pid !== process.pid)
        .filter(proc => proc.name === 'node' && proc.pid !== process.pid && !proc.cmd?.includes(WORKFLOW_ID))
    const filter = alfy.input;
    /** @type {(import('ps-list').ProcessDescriptor & { port?: string })[]} */
    let items = []

    // Filtering by port (filter prefixed with ":").
    if (filter.startsWith(':')) {
        const portFilter = filter.slice(1);

        const portToPidMap = await pidFromPort.list();
        const pidToPortMap = new Map();
        for (const entry of portToPidMap.entries()) {
            const port = String(entry[0]);

            if (!port.includes(portFilter)) {
                // Filter out results which don't match the search term
                continue;
            }

            pidToPortMap.set(entry[1], String(entry[0]));
        }

        items = processes
            .filter(proc => pidToPortMap.has(proc.pid))
            .map(proc => Object.assign({}, proc, { port: pidToPortMap.get(proc.pid) }));
    } else {
        items = alfy.inputMatches(processes, 'cmd')
    }

    alfy.output(
        items
            .map(proc => {
                const cleanedPath = (proc.cmd || '---no command--')
                    .replace(/\.app\/Contents\/.*$/, '.app')
                    .replace(HOMEDIR_RE, '~');

                let subtitle = `(${proc.pid}) ${cleanedPath}`;

                if (proc.port) {
                    // TODO; Use `proc.path` property
                    subtitle = `${proc.port} - ${subtitle}`;
                }

                return {
                    title: cleanedPath,
                    subtitle,
                    arg: proc.pid,
                    mods: {
                        shift: {
                            subtitle: `CPU ${proc.cpu}%, Memory: ${proc.memory}`
                        },
                    }
                };
            })
            .sort(util.sorter)
    );
}

main();
