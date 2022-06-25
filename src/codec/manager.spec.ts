import { concatBytes } from '../utils/buffer';
import { Codec, Manager } from '.';
import { createAssetTx, createAssetTxBytes } from '../fixtures/avax';
import { Bytes, Short, Stringpr } from '../primitives';
import { CreateAssetTx } from '../vms/avm/createAssetTx';

// jest.mock('../vms/avm/createAssetTx');

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
    jest.clearAllMocks();
  });

  it('chooses the right codec', () => {
    CreateAssetTx.fromBytes = jest.fn(() => [
      createAssetTx(),
      new Uint8Array(),
    ]);

    const input = concatBytes(new Short(1).toBytes(), createAssetTxBytes());

    m.unpackCodec(input, CreateAssetTx);

    expect(CreateAssetTx.fromBytes).toBeCalledWith(
      createAssetTxBytes(),
      codec1,
    );
  });

  it('packs with correct prefix', () => {
    const tx = createAssetTx();
    tx.toBytes = jest.fn(() => createAssetTxBytes());
    const bytes = m.packCodec(tx, 1);

    const output = concatBytes(new Short(1).toBytes(), createAssetTxBytes());

    expect(tx.toBytes).toBeCalledWith(codec1);
    expect(bytes).toEqual(output);
  });
});
