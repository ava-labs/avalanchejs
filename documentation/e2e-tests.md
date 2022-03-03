# E2E Testing

To run E2E tests locally, run the `avash_avalanchejs_e2e.sh` script and pass in two arguments. The first is your full working directory of your Avash directory, and the second is the full working directory of your AvalancheJS directory.

`./avash_avalanchejs_e2e.sh "<avash dir>" "<avalanchejs dir>"`

For example,

`./avash_avalanchejs_e2e.sh "/path/to/avash/" "/path/to/avalanchejs/"`

This script runs the five node script by default.

- New E2E tests go in the /e2e_tests/ directory.

Follow the steps below if you do not wish to use the five node script, but instead test against one of the nodes. You provide the PORT of the specified node.

## Avash

This option does not require executing a docker container, but it may not lead to the same results of CI, depending on the branch, version, and configuration options of the nodes executed by avash.

* Launch `avash`
* Set env vars `AVALANCHEGO_IP`, `AVALANCHEGO_PORT` to point to one of the nodes of avash
* From avalanchejs dir execute: `yarn test -i --roots e2e_tests`

Example workflow

```zsh
cd /path/to/avash
 ./avash
avash> runscript scripts/five_node_staking.lua

# Open another terminal tab/window
cd /path/to/avalanchejs
AVALANCHEGO_IP=localhost AVALANCHEGO_PORT=9650 yarn test -i --roots e2e_tests
```
