export const AVM = 'AVM' as const;
export const EVM = 'EVM' as const;
export const PVM = 'PVM' as const;

export type VM = typeof AVM | typeof EVM | typeof PVM;
export const ValidVMs = [AVM, EVM, PVM] as const;

export enum TypeSymbols {
  Codec = 'codec',

  // AVAX
  BaseTx = 'avax.BaseTx',
  TransferableOutput = 'avax.TransferableOutput',
  TransferableInput = 'avax.TransferableInput',
  TransferableOp = 'avax.TransferableOp',
  UTXOID = 'avax.UTXOID',
  UTXO = 'avax.Utxo',

  // COMMON
  Id = 'common.Id',
  Address = 'common.Address',
  NodeId = 'common.NodeId',

  // PRIMITIVES
  Int = 'primitives.Int',
  BigIntPr = 'primitives.BigInt',
  StringPr = 'primitives.String',
  Byte = 'primitives.Byte',
  Bytes = 'primitives.Bytes',
  Short = 'primitives.Short',

  // SECP256k1FX
  Input = 'secp256k1fx.Input',
  TransferInput = 'secp256k1fx.TransferInput',
  TransferOutput = 'secp256k1fx.TransferOutput',
  OutputOwners = 'secp256k1fx.OutputOwners',
  OutputOwnersList = 'secp256k1fx.OutputOwnersList',
  Credential = 'secp256k1fx.Credential',
  Signature = 'secp256k1fx.Signature',
  SecpMintOperation = 'secp256k1fx.MintOperation',
  SecpMintOutput = 'secp256k1fx.MintOutput',

  // NFTFX
  NftFxMintOperation = 'nftfx.MintOperation',
  NftFxMintOutput = 'nftfx.MintOutput',
  NftFxTransferOperation = 'nftfx.TransferOperation',
  NftFxTransferOutput = 'nftfx.TransferOutput',
  NftFxCredential = 'nftfx.Credential',

  // AVM
  AvmBaseTx = 'avm.BaseTx',
  AvmExportTx = 'avm.ExportTx',
  AvmImportTx = 'avm.ImportTx',
  CreateAssetTx = 'avm.CreateAssetTx',
  OperationTx = 'avm.OperationTx',
  InitialState = 'avm.InitialState',
  AvmSignedTx = 'avm.SignedTx',

  // PVM
  PvmBaseTx = 'pvm.BaseTx',
  StakeableLockIn = 'pvm.StakeableLockIn',
  StakeableLockOut = 'pvm.StakeableLockOut',
  AddDelegatorTx = 'pvm.AddDelegatorTx',
  AddValidatorTx = 'pvm.AddValidatorTx',
  AddPermissionlessDelegatorTx = 'pvm.AddPermissionlessDelegator',
  AddPermissionlessValidatorTx = 'pvm.AddPermissionlessValidator',
  Validator = 'pvm.Validator',
  SubnetValidator = 'pvm.SubnetValidator',
  Signer = 'pvm.signer',
  SignerEmpty = 'pvm.signerEmpty',
  ProofOfPossession = 'pvm.proofOfPossession',
  AddSubnetValidatorTx = 'pvm.AddSubnetValidator',
  AdvanceTimeTx = 'pvm.AdvanceTimeTx',
  CreateChainTx = 'pvm.CreateChainTx',
  CreateSubnetTx = 'pvm.CreateSubnetTx',
  PvmExportTx = 'pvm.ExportTx',
  PvmImportTx = 'pvm.ImportTx',
  RewardValidatorTx = 'pvm.RewardValidatorTx',
  RemoveSubnetValidatorTx = 'pvm.RemoveSubnetValidator',
  TransformSubnetTx = 'pvm.TransformSubnetTx',
  TransferSubnetOwnershipTx = 'pvm.TransferSubnetOwnershipTx',

  // EVM
  EvmExportTx = 'evm.ExportTx',
  EvmInput = 'evm.Input',
  EvmOutput = 'evm.Output',
  EvmImportTx = 'evm.ImportTx',
}
