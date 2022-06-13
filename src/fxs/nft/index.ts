import { MintOutput } from './mintOutput';
import { TransferOutput } from './transferOutput';

// https://github.com/ava-labs/avalanchego/blob/master/vms/nftfx/fx.go
const TypeRegistry = Object.freeze([
  MintOutput,
  TransferOutput,
  undefined, // TODO: MintOperation
  undefined, // TODO: TransferOperation
  undefined, // TODO: Credential
]);

export { MintOutput, TransferOutput, TypeRegistry };
