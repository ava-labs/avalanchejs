import { Codec, Manager } from '../codec';
import * as Secp256k1Fx from '../fxs/secp256k1';
import { ExportTx } from './exportTx';
import { ImportTx } from './importTx';

// https://github.com/ava-labs/coreth/blob/master/plugin/evm/codec.go
let manager;
export const codec = new Codec([
  ImportTx, // 0
  ExportTx, // 1

  ...Array(3).fill(undefined),

  ...Secp256k1Fx.TypeRegistry,
  Secp256k1Fx.Input,
  Secp256k1Fx.OutputOwners,
]);

export const getEVMManager = () => {
  if (manager) return manager;
  manager = new Manager();
  manager.RegisterCodec(0, codec);
  return manager;
};
