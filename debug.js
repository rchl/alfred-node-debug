import treeKill from 'tree-kill';

/** @param {number} pid */
const sendSigusr1 = pid => {
    return new Promise(resolve => {
        treeKill(pid, 'SIGUSR1', error => {
            resolve(error);
        });
    });
}

sendSigusr1(Number.parseInt(process.argv[2]))
