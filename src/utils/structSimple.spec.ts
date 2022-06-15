import {
  mintOutput,
  mintOutputBytes,
  transferOutput,
  transferOutputBytes,
} from '../fixtures/secp256k1';
import { MintOutput, TransferOutput } from '../fxs/secp256k1';
import { merge } from './buffer';
import { unpackSimple } from './structSimple';

describe('structSimple', () => {
  it('unpackSimple', () => {
    const input: Uint8Array = merge([transferOutputBytes(), mintOutputBytes()]);

    const outputArray = [TransferOutput, MintOutput] as const;
    const [tsOutput, mntOutput, remaining] = unpackSimple(input, outputArray);
    expect(tsOutput).toEqual(transferOutput());
    expect(mntOutput).toEqual(mintOutput());
    expect(remaining).toEqual(new Uint8Array());
  });
});
