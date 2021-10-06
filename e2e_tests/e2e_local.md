# How to execute the tests locally

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

## Container

### Execution

Env vars `DOCKER_USERNAME`, `DOCKER_PASS` must be defined to a account that has rights to access avalanche-testing images

Execute the script from avalanchejs dir: `./e2e_tests/e2e_local.sh`

### Docker image

The script adds the last version of avalanchego to the docker image used in CI. The new image is called
`avaplatform/avalanche-testing:avalanchejs_local_e2e_${AVALANCHEGO_BRANCH}` where `AVALANCHEGO_BRANCH` 
depends on current avalanchejs branch (master => master, other => dev).

It creates the corresponding image only the first time it is called. In order to rebuild the image,
for example for checking against an new version of avalanchego, the image must be locally removed.
