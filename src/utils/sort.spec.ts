import { jest } from '@jest/globals';
import { testCodec, testPVMCodec } from '../fixtures/codec';
import {
  getStakeableLockedTransferableOutForTest,
  getTransferableOutForTest,
} from '../fixtures/transactions';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
jest.unstable_mockModule('./bytesCompare', () => ({
  bytesCompare: jest.fn(),
}));

const { bytesCompare } = await import('./bytesCompare');
const { compareTransferableOutputs } = await import('./sort');

describe('compareTransferableOutputs', () => {
  const avmCodec = testCodec();
  const pvmCodec = testPVMCodec();

  beforeEach(() => {
    jest.restoreAllMocks();
    (bytesCompare as jest.Mock).mockReturnValueOnce(-1);
  });

  it('sorts transferable outputs correctly', () => {
    const transferableOutput1 = getTransferableOutForTest(1n);
    const transferableOutput2 = getTransferableOutForTest(2n);

    const result = compareTransferableOutputs(
      transferableOutput1,
      transferableOutput2,
    );

    expect(result).toEqual(-1);
    expect(bytesCompare).toBeCalledTimes(1);
    expect(bytesCompare).toBeCalledWith(
      transferableOutput1.toBytes(avmCodec),
      transferableOutput2.toBytes(avmCodec),
    );
  });

  it('sorts stakeable locked outs correctly', () => {
    const transferableOutput1 = getStakeableLockedTransferableOutForTest(
      1n,
      100n,
    );
    const transferableOutput2 = getStakeableLockedTransferableOutForTest(
      2n,
      200n,
    );

    const result = compareTransferableOutputs(
      transferableOutput1,
      transferableOutput2,
    );

    expect(result).toEqual(-1);
    expect(bytesCompare).toBeCalledWith(
      transferableOutput1.toBytes(pvmCodec),
      transferableOutput2.toBytes(pvmCodec),
    );
  });

  it('sorts transferable outputs and stakeable locked outs correctly', () => {
    const transferableOutput1 = getTransferableOutForTest(1n);
    const transferableOutput2 = getStakeableLockedTransferableOutForTest(
      1n,
      100n,
    );

    const result = compareTransferableOutputs(
      transferableOutput1,
      transferableOutput2,
    );

    expect(result).toEqual(-1);
    expect(bytesCompare).toBeCalledWith(
      transferableOutput1.toBytes(avmCodec),
      transferableOutput2.toBytes(pvmCodec),
    );
  });
});
