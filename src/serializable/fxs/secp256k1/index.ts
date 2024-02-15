import { Credential } from './credential';
import { Input } from './input';
import { MintOperation } from './mintOperation';
import { MintOutput } from './mintOutput';
import { OutputOwners } from './outputOwners';
import { OutputOwnersList } from './outputOwnersList';
import { Signature } from './signature';
import { TransferInput } from './transferInput';
import { TransferOutput } from './transferOutput';

// https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/fx.go
const TypeRegistry = Object.freeze([
  TransferInput,
  MintOutput,
  TransferOutput,
  MintOperation,
  Credential,
]);

export {
  Input,
  MintOperation,
  MintOutput,
  OutputOwners,
  OutputOwnersList,
  TransferInput,
  TransferOutput,
  Credential,
  Signature,
  TypeRegistry,
};
