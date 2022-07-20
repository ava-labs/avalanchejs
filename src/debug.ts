import { printDeep } from './utils';
import { PVMApi } from './vms/pvm';

// this file is placed here as a way to test out the ergonomics of the
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const main = async () => {
  printDeep(
    await new PVMApi().getStake({
      addresses: ['P-avax1pmgmagjcljjzuz2ve339dx82khm7q8getlegte'],
    }),
  );
};

main();
