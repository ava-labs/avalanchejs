import { Codec, Manager } from '../../codec';
import * as Secp256k1Fx from '../../fxs/secp256k1';

// https://github.com/ava-labs/avalanchego/blob/master/vms/platformvm/codec.go
const manager = new Manager();
manager.RegisterCodec(
  0,
  new Codec([
    undefined, // TODO: ProposalBlock
    undefined, // TODO: AbortBlock
    undefined, // TODO: CommitBlock
    undefined, // TODO: StandardBlock
    undefined, // TODO: AtomicBlock

    ...Secp256k1Fx.TypeRegistry,
    Secp256k1Fx.Input,
    Secp256k1Fx.OutputOwners,

    undefined, // TODO: UnsignedAddValidatorTx
    undefined, // TODO: UnsignedAddSubnetValidatorTx
    undefined, // TODO: UnsignedAddDelegatorTx

    undefined, // TODO: UnsignedCreateChainTx
    undefined, // TODO: UnsignedCreateSubnetTx

    undefined, // TODO: UnsignedImportTx
    undefined, // TODO: UnsignedExportTx

    undefined, // TODO: UnsignedAdvanceTimeTx
    undefined, // TODO: UnsignedRewardValidatorTx

    undefined, // TODO: stakeable.LockIn
    undefined, // TODO: stakeable.LockOut
  ]),
);

export { manager };
