import util from 'util';
import { bufferToHex } from './buffer';

// useful for printing transactions
export const printJSON = (obj: any) => {
  console.log(JSON.stringify(obj, null, 2));
};

// useful for printing nested objects
export const printDeep = (obj: any) => {
  console.log(util.inspect(obj, { depth: null, colors: true }));
};

export const printHex = (bytes: Uint8Array, name = '') => {
  console.log(`name = ${name}`, bufferToHex(bytes));
};
