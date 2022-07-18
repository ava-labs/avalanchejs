// this file is placed here as a way to test out the ergonomics of the

import { exportTx } from './fixtures/avax';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const main = async () => {
  console.log(exportTx().bytes());
};

main();
