import { MintOperation } from './mintOperation';
import { MintOutput } from './mintOutput';
import { TransferOutput } from './transferOutput';

// https://github.com/ava-labs/avalanchego/blob/master/vms/nftfx/fx.go
const TypeRegistry = Object.freeze([
  MintOutput,
  TransferOutput,
  MintOperation, 
  undefined, // TODO: TransferOperation
  undefined, // TODO: Credential
]);

export { MintOutput, TransferOutput, MintOperation, TypeRegistry };
