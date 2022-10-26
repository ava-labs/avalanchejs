# E2E Testing

We can do the end-to-end testing for the latest CaminoJS by setting up a local Camino network and running the `e2e_tests` in the root directory.

## Setup Local Camino Network

For testing end to end, you need to have a local network running. This can easily be achieved by using Camino Network Runner. You can follow the steps [here](https://github.com/chain4travel/camino-network-runner) to setup a local network.

## Setup Environment Variables

You need to add IP and PORT of the node running the local network to your environment variables. Run the following command according to your setup:

```bash
CAMINOGO_IP=0.0.0.0
CAMINOGO_PORT=9650
```

## Run Tests

The following command will start the E2E testing

```
yarn test -i --roots e2e_tests
```
