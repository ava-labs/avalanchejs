import { Codec, Manager } from '../codec';
import * as Secp256k1Fx from '../fxs/secp256k1';

// https://github.com/ava-labs/coreth/blob/master/plugin/evm/codec.go
const manager = new Manager();
manager.RegisterCodec(
  0,
  new Codec([
    undefined, // TODO: UnsignedImportTx
    undefined, // TODO: UnsignedExportTx

    ...Array(3).fill(undefined),

    ...Secp256k1Fx.TypeRegistry,
    Secp256k1Fx.Input,
    Secp256k1Fx.OutputOwners,
  ]),
);

export { manager };
