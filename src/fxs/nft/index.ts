import { MintOperation } from './mintOperation';
import { MintOutput } from './mintOutput';
import { TransferOperation } from './transferOperation';
import { TransferOutput } from './transferOutput';

// https://github.com/ava-labs/avalanchego/blob/master/vms/nftfx/fx.go
const TypeRegistry = Object.freeze([
  MintOutput,
  TransferOutput,
  MintOperation,
  TransferOperation,
  undefined, // TODO: Credential
]);

export {
  MintOutput,
  TransferOutput,
  MintOperation,
  TransferOperation,
  TypeRegistry,
};
