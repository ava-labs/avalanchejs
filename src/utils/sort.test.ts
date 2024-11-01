import { describe, expect, it, vi } from 'vitest';
import { testCodec, testPVMCodec } from '../fixtures/codec';
import {
  getStakeableLockedTransferableOutForTest,
  getTransferableOutForTest,
} from '../fixtures/transactions';
import { compareTransferableOutputs } from './sort';

describe('compareTransferableOutputs', () => {
  const avmCodec = testCodec();
  const pvmCodec = testPVMCodec();

  it('sorts transferable outputs correctly', () => {
    const transferableOutput1 = getTransferableOutForTest(1n);
    const transferableOutput2 = getTransferableOutForTest(2n);

    const toBytesMock1 = vi.spyOn(transferableOutput1, 'toBytes');
    const toBytesMock2 = vi.spyOn(transferableOutput2, 'toBytes');

    compareTransferableOutputs(transferableOutput1, transferableOutput2);

    expect(toBytesMock1).toBeCalledTimes(1);
    expect(toBytesMock2).toBeCalledTimes(1);
    expect(toBytesMock1).toBeCalledWith(avmCodec);
    expect(toBytesMock2).toBeCalledWith(avmCodec);
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

    const toBytesMock1 = vi.spyOn(transferableOutput1, 'toBytes');
    const toBytesMock2 = vi.spyOn(transferableOutput2, 'toBytes');

    compareTransferableOutputs(transferableOutput1, transferableOutput2);

    expect(toBytesMock1).toBeCalledTimes(1);
    expect(toBytesMock2).toBeCalledTimes(1);
    expect(toBytesMock1).toBeCalledWith(pvmCodec);
    expect(toBytesMock2).toBeCalledWith(pvmCodec);
  });

  it('sorts transferable outputs and stakeable locked outs correctly', () => {
    const transferableOutput1 = getTransferableOutForTest(1n);
    const transferableOutput2 = getStakeableLockedTransferableOutForTest(
      1n,
      100n,
    );

    const toBytesMock1 = vi.spyOn(transferableOutput1, 'toBytes');
    const toBytesMock2 = vi.spyOn(transferableOutput2, 'toBytes');

    compareTransferableOutputs(transferableOutput1, transferableOutput2);

    expect(toBytesMock1).toBeCalledTimes(1);
    expect(toBytesMock2).toBeCalledTimes(1);
    expect(toBytesMock1).toBeCalledWith(avmCodec);
    expect(toBytesMock2).toBeCalledWith(pvmCodec);
  });
});
