import { Codec, Manager } from '../codec';
import * as Secp256k1Fx from '../fxs/secp256k1';
import { AddDelegatorTx } from './addDelegatorTx';
import { AddSubnetValidatorTx } from './addSubnetValidatorTx';
import { AddValidatorTx } from './addValidatorTx';
import { AdvanceTimeTx } from './advanceTimeTx';
import { CreateChainTx } from './createChainTx';
import { CreateSubnetTx } from './createSubnetTx';
import { ExportTx } from './exportTx';
import { ImportTx } from './importTx';
import { RewardValidatorTx } from './rewardValidatorTx';
import { StakeableLockIn } from './stakeableLockIn';
import { StakeableLockOut } from './stakeableLockOut';
import { AddPermissionlessValidatorTx } from './addPermissionlessValidatorTx';
import { AddPermissionlessDelegatorTx } from './addPermissionlessDelegatorTx';
import { Signer, SignerEmpty } from './signer';
import { RemoveSubnetValidatorTx } from './removeSubnetValidatorTx';
import { TransferSubnetOwnershipTx } from './transferSubnetOwnershipTx';
import { TransformSubnetTx } from './transformSubnetTx';
import { BaseTx } from './baseTx';
import { ConvertSubnetTx } from './convertSubnetTx';
import { IncreaseBalanceTx } from './increaseBalanceTx';
import { DisableSubnetValidatorTx } from './disableSubnetValidatorTx';
import { SetSubnetValidatorWeightTx } from './setSubnetValidatorWeightTx';
import { RegisterSubnetValidatorTx } from './registerSubnetValidatorTx';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/platformvm/txs/codec.go#L35
 */
export const codec = new Codec([
  ...new Array(5), // 0-4

  ...Secp256k1Fx.TypeRegistry, // 5-9
  Secp256k1Fx.Input, // 10
  Secp256k1Fx.OutputOwners, //11

  AddValidatorTx, // 12
  AddSubnetValidatorTx, // 13
  AddDelegatorTx, // 14

  CreateChainTx, // 15
  CreateSubnetTx, // 16

  ImportTx, // 17
  ExportTx, // 18

  AdvanceTimeTx, //19
  RewardValidatorTx, //20

  StakeableLockIn, // 21
  StakeableLockOut, // 22

  RemoveSubnetValidatorTx, //23
  TransformSubnetTx, // 24
  AddPermissionlessValidatorTx, //  25
  AddPermissionlessDelegatorTx, // 26

  SignerEmpty, // 27
  Signer, // 28

  ...new Array(4), // 29-32

  TransferSubnetOwnershipTx, // 33
  BaseTx, // 34

  ConvertSubnetTx, // 35
  RegisterSubnetValidatorTx, // 36
  SetSubnetValidatorWeightTx, // 37
  IncreaseBalanceTx, // 38
  DisableSubnetValidatorTx, // 39
]);

let manager: Manager;
export const getPVMManager = () => {
  if (manager) return manager;
  manager = new Manager();
  manager.RegisterCodec(0, codec);
  return manager;
};