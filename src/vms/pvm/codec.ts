import { Codec, Manager } from '../../codec';
import { BaseTx } from '../../components/avax';
import * as Secp256k1Fx from '../../fxs/secp256k1';
import { ImportTx } from '../avm';
import { AddDelegatorTx } from './addDelegatorTx';
import { AddSubnetValidatorTx } from './addSubnetValidatorTx';
import { AddValidatorTx } from './addValidatorTx';
import { AdvanceTimeTx } from './advanceTimeTx';
import { CreateChainTx } from './createChainTx';
import { CreateSubnetTx } from './createSubnetTx';
import { ExportTx } from './exportTx';
import { RewardValidatorTx } from './rewardValidatorTx';
import { StakableLockIn } from './stakableLockIn';
import { StakableLockOut } from './stakableLockOut';

// https://github.com/ava-labs/avalanchego/blob/master/vms/platformvm/codec.go
export const codec = new Codec([
  BaseTx, // TODO: ProposalBlock // 0
  undefined, // TODO: AbortBlock // 1
  undefined, // TODO: CommitBlock // 2
  undefined, // TODO: StandardBlock // 3
  undefined, // TODO: AtomicBlock // 4

  ...Secp256k1Fx.TypeRegistry, // 5-9
  Secp256k1Fx.Input, // 10
  Secp256k1Fx.OutputOwners, //11

  AddValidatorTx, // 5
  AddSubnetValidatorTx, // 6
  AddDelegatorTx, // 7

  CreateChainTx, // TODO: 8
  CreateSubnetTx, // TODO: 9

  ImportTx, // 10
  ExportTx, // 11

  AdvanceTimeTx, //12
  RewardValidatorTx, //13

  StakableLockIn, // 14
  StakableLockOut, // 15
]);

export const manager = new Manager();
manager.RegisterCodec(0, codec);
