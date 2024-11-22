import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Codec, Manager } from '.';
import { createAssetTx, createAssetTxBytes } from '../../fixtures/avax';
import { bytesForInt } from '../../fixtures/utils/bytesFor';
import { concatBytes } from '../../utils/buffer';
import { CreateAssetTx } from '../avm/createAssetTx';
import { Bytes, Short, Stringpr } from '../primitives';

describe('Manager', () => {
  it('registers multiple codecs', () => {
    const m = new Manager();
    m.RegisterCodec(0, new Codec([]));
    m.RegisterCodec(1, new Codec([]));
  });

  it('errors when registering a codec version twice', () => {
    const m = new Manager();
    m.RegisterCodec(0, new Codec([]));
    expect(() => m.RegisterCodec(0, new Codec([]))).toThrow(
      'duplicated codec version',
    );
  });
});

describe('using the codecs', () => {
  let m: Manager;
  let codec1: Codec;
  beforeEach(() => {
    m = new Manager();
    codec1 = new Codec([Bytes]);

    //filler
    m.RegisterCodec(0, new Codec([Stringpr]));

    m.RegisterCodec(1, codec1);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('chooses the right codec', () => {
    CreateAssetTx.fromBytes = vi.fn<() => [CreateAssetTx, Uint8Array]>(() => [
      createAssetTx(),
      new Uint8Array(),
    ]);

    const input = concatBytes(new Short(1).toBytes(), createAssetTxBytes());

    m.unpack(input, CreateAssetTx);

    expect(CreateAssetTx.fromBytes).toBeCalledWith(
      createAssetTxBytes(),
      codec1,
    );
  });

  it('packs with correct prefix', () => {
    const tx = createAssetTx();
    codec1.PackPrefix = vi.fn(() =>
      concatBytes(bytesForInt(2), createAssetTxBytes()),
    );
    const bytes = m.packCodec(tx, 1);

    const output = concatBytes(
      new Short(1).toBytes(),
      concatBytes(bytesForInt(2), createAssetTxBytes()),
    );

    expect(codec1.PackPrefix).toBeCalledWith(tx);
    expect(bytes).toEqual(output);
  });
});
