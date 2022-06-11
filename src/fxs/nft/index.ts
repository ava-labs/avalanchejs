import { MintOutput } from './mintOutput';
import { TransferOutput } from './transferOutput';

const TypeRegistry = Object.freeze([
  MintOutput,
  TransferOutput,
  undefined, // TODO: MintOperation
  undefined, // TODO: TransferOperation
  undefined, // TODO: Credential
]);

export { MintOutput, TransferOutput, TypeRegistry };
