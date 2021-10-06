# How to execute the tests locally

## Avash

This option does not require executing a docker container, but it may not lead to the same results of CI,
depending on the branch, version, and configuration options of the nodes executed by avash.

- launch `avash`
- set env vars `AVALANCHEGO_IP`, `AVALANCHEGO_PORT` to point to one of the nodes of avash
- from avalanchejs dir execute: `yarn test -i --roots e2e_tests`

