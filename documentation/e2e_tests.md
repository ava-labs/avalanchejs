# E2E Testing

To run E2E tests locally, you need to be running a fresh instance of Avash and run the following command in the root of the project.

`AVALANCHEGO_IP=localhost AVALANCHEGO_PORT=9650 yarn test -i --roots e2e_tests`

Currently, running the test suite more than once will result in some tests not passing the second time because of a non-clean Avash state.

- New E2E tests go in the /e2e_tests/ directory.

