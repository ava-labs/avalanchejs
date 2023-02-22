// this file is placed here as a way to test out the ergonomics of the
// sdk during dev. To run, do yarn debug

import { hexToBuffer, printDeep } from './utils';
import { EVMUnsignedTx } from './vms';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const main = async () => {
  const tx = EVMUnsignedTx.fromJSON(
    `{"codecId":"0","vm":"EVM","txBytes":"0x000000000001000000057fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d50000000000000000000000000000000000000000000000000000000000000000000000015f658a6d1928c39b286b48192fea8d46d87ad0770000000005fa29ae3d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000000000019a000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000005f5e10000000000000000000000000100000001e0cfe8cae22827d032805ded484e393ce51cbedb","utxos":[],"addressMaps":[[["0x5f658a6d1928c39b286b48192fea8d46d87ad077",0]]],"credentials":[["0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"]]}`,
  );
  printDeep(tx);
  const txBytes = tx.toBytes();

  tx.addSignature(
    hexToBuffer(
      '93500189a039993d744440fa1179caa97dae131fa03e74cf7f34e865af1bb9316806732004ac0c471be3a7337f20f63f560195cdefdc4d7beb0d5aa6ee35d71f00',
    ),
  );

  console.log(tx.hasAllSignatures());

  printDeep(tx);
};

main();
