// this file is placed here as a way to test out the ergonomics of the

import { EVMApi } from './vms/evm/c-chain';

// sdk during dev. To run, do yarn debug
// eslint-disable-next-line @typescript-eslint/no-empty-function
const main = async () => {
  const c = new EVMApi();
  c.getUTXOs({
    addresses: [],
  });
};

main();
