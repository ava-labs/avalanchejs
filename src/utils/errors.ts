const ADDRESS_ERROR_CODE: string = "1000"
const GOOSE_EGG_CHECK_ERROR_CODE: string = "1001"
const CHAIN_ID_ERROR_CODE: string = "1002"
const NO_ATOMIX_UTXOS_ERROR_CODE: string = "1003"
const SYMBOL_ERROR_CODE: string = "1004"
const NAME_ERROR_CODE: string = "1005"
const TRANSACTION_ERROR_CODE: string = "1006"
const CODEC_ID_ERROR_CODE: string = "1007"
const CRED_ID_ERROR_CODE: string = "1008"
const TRANSFERABLE_OUTPUT_ERROR_CODE: string = "1009"
const TRANSFERABLE_INPUT_ERROR_CODE: string = "1010"
const INPUT_ID_ERROR_CODE: string = "1011"
const OPERATION_ERROR_CODE: string = "1012"
const INVALID_OPERATION_ID_CODE: string = "1013"
const CHECKSUM_ERROR_CODE: string = "1014"
const OUTPUT_ID_ERROR_CODE: string = "1015"
const UTXO_ERROR_CODE: string = "1016"
const INSUFFICIENT_FUNDS_ERROR_CODE: string = "1017"
const THRESHOLD_ERROR_CODE: string = "1018"
const SECP_MINT_OUTPUT_ERROR_CODE: string = "1019"
const EVM_INPUT_ERROR_CODE: string = "1020"
const EVM_OUTPUT_ERROR_CODE: string = "1021"
const FEE_ASSET_ERROR_CODE: string = "1022"
const STAKE_ERROR_CODE: string = "1023"
const TIME_ERROR_CODE: string = "1024"
const DELEGATION_FEE_ERROR_CODE: string = "1025"
const SUBNET_OWNER_ERROR_CODE: string = "1026"
const BUFFER_SIZE_ERROR_CODE: string = "1027"
const ADDRESS_INDEX_ERROR_CODE: string = "1028"
const PUBLIC_KEY_ERROR_CODE: string = "1029"
const MERGE_RULE_ERROR_CODE: string = "1030"
const BASE58_ERROR_CODE: string = "1031"
const PRIVATE_KEY_ERROR_CODE: string = "1032"
const NODE_ID_ERROR_CODE: string = "1033"
const HEX_ERROR_CODE: string = "1034"
const TYPE_ID_ERROR_CODE: string = "1035"
const UNKNOWN_TYPE_ERROR_CODE: string = "1036"
const BECH32_ERROR_CODE: string = "1037"
const EVM_FEE_ERROR_CODE: string = "1038"
const INVALID_ENTROPY: string = "1039"
const PROTOCOL_ERROR_CODE: string = "1040"
const SUBNET_ID_ERROR_CODE: string = "1041"
const TYPE_NAME_ERROR_CODE: string = "1042"
const SUBNET_THRESHOLD_ERROR_CODE: string = "1043"
const SUBNET_ADDRESS_ERROR_CODE: string = "1044"

export class AvalancheError extends Error {
  errorCode: string
  constructor(m: string, code: string) {
    super(m)
    Object.setPrototypeOf(this, AvalancheError.prototype)
    this.errorCode = code
  }

  getCode() {
    return this.errorCode
  }
}

export class AddressError extends AvalancheError {
  constructor(m: string) {
    super(m, ADDRESS_ERROR_CODE)
    Object.setPrototypeOf(this, AddressError.prototype)
  }
}

export class GooseEggCheckError extends AvalancheError {
  constructor(m: string) {
    super(m, GOOSE_EGG_CHECK_ERROR_CODE)
    Object.setPrototypeOf(this, GooseEggCheckError.prototype)
  }
}

export class ChainIdError extends AvalancheError {
  constructor(m: string) {
    super(m, CHAIN_ID_ERROR_CODE)
    Object.setPrototypeOf(this, ChainIdError.prototype)
  }
}

export class NoAtomicUTXOsError extends AvalancheError {
  constructor(m: string) {
    super(m, NO_ATOMIX_UTXOS_ERROR_CODE)
    Object.setPrototypeOf(this, NoAtomicUTXOsError.prototype)
  }
}

export class SymbolError extends AvalancheError {
  constructor(m: string) {
    super(m, SYMBOL_ERROR_CODE)
    Object.setPrototypeOf(this, SymbolError.prototype)
  }
}

export class NameError extends AvalancheError {
  constructor(m: string) {
    super(m, NAME_ERROR_CODE)
    Object.setPrototypeOf(this, NameError.prototype)
  }
}

export class TransactionError extends AvalancheError {
  constructor(m: string) {
    super(m, TRANSACTION_ERROR_CODE)
    Object.setPrototypeOf(this, TransactionError.prototype)
  }
}

export class CodecIdError extends AvalancheError {
  constructor(m: string) {
    super(m, CODEC_ID_ERROR_CODE)
    Object.setPrototypeOf(this, CodecIdError.prototype)
  }
}

export class CredIdError extends AvalancheError {
  constructor(m: string) {
    super(m, CRED_ID_ERROR_CODE)
    Object.setPrototypeOf(this, CredIdError.prototype)
  }
}

export class TransferableOutputError extends AvalancheError {
  constructor(m: string) {
    super(m, TRANSFERABLE_OUTPUT_ERROR_CODE)
    Object.setPrototypeOf(this, TransferableOutputError.prototype)
  }
}

export class TransferableInputError extends AvalancheError {
  constructor(m: string) {
    super(m, TRANSFERABLE_INPUT_ERROR_CODE)
    Object.setPrototypeOf(this, TransferableInputError.prototype)
  }
}

export class InputIdError extends AvalancheError {
  constructor(m: string) {
    super(m, INPUT_ID_ERROR_CODE)
    Object.setPrototypeOf(this, InputIdError.prototype)
  }
}

export class OperationError extends AvalancheError {
  constructor(m: string) {
    super(m, OPERATION_ERROR_CODE)
    Object.setPrototypeOf(this, OperationError.prototype)
  }
}

export class InvalidOperationIdError extends AvalancheError {
  constructor(m: string) {
    super(m, INVALID_OPERATION_ID_CODE)
    Object.setPrototypeOf(this, InvalidOperationIdError.prototype)
  }
}

export class ChecksumError extends AvalancheError {
  constructor(m: string) {
    super(m, CHECKSUM_ERROR_CODE)
    Object.setPrototypeOf(this, ChecksumError.prototype)
  }
}

export class OutputIdError extends AvalancheError {
  constructor(m: string) {
    super(m, OUTPUT_ID_ERROR_CODE)
    Object.setPrototypeOf(this, OutputIdError.prototype)
  }
}

export class UTXOError extends AvalancheError {
  constructor(m: string) {
    super(m, UTXO_ERROR_CODE)
    Object.setPrototypeOf(this, UTXOError.prototype)
  }
}

export class InsufficientFundsError extends AvalancheError {
  constructor(m: string) {
    super(m, INSUFFICIENT_FUNDS_ERROR_CODE)
    Object.setPrototypeOf(this, InsufficientFundsError.prototype)
  }
}

export class ThresholdError extends AvalancheError {
  constructor(m: string) {
    super(m, THRESHOLD_ERROR_CODE)
    Object.setPrototypeOf(this, ThresholdError.prototype)
  }
}

export class SECPMintOutputError extends AvalancheError {
  constructor(m: string) {
    super(m, SECP_MINT_OUTPUT_ERROR_CODE)
    Object.setPrototypeOf(this, SECPMintOutputError.prototype)
  }
}

export class EVMInputError extends AvalancheError {
  constructor(m: string) {
    super(m, EVM_INPUT_ERROR_CODE)
    Object.setPrototypeOf(this, EVMInputError.prototype)
  }
}

export class EVMOutputError extends AvalancheError {
  constructor(m: string) {
    super(m, EVM_OUTPUT_ERROR_CODE)
    Object.setPrototypeOf(this, EVMOutputError.prototype)
  }
}

export class FeeAssetError extends AvalancheError {
  constructor(m: string) {
    super(m, FEE_ASSET_ERROR_CODE)
    Object.setPrototypeOf(this, FeeAssetError.prototype)
  }
}

export class StakeError extends AvalancheError {
  constructor(m: string) {
    super(m, STAKE_ERROR_CODE)
    Object.setPrototypeOf(this, StakeError.prototype)
  }
}

export class TimeError extends AvalancheError {
  constructor(m: string) {
    super(m, TIME_ERROR_CODE)
    Object.setPrototypeOf(this, TimeError.prototype)
  }
}

export class DelegationFeeError extends AvalancheError {
  constructor(m: string) {
    super(m, DELEGATION_FEE_ERROR_CODE)
    Object.setPrototypeOf(this, DelegationFeeError.prototype)
  }
}

export class SubnetOwnerError extends AvalancheError {
  constructor(m: string) {
    super(m, SUBNET_OWNER_ERROR_CODE)
    Object.setPrototypeOf(this, SubnetOwnerError.prototype)
  }
}

export class BufferSizeError extends AvalancheError {
  constructor(m: string) {
    super(m, BUFFER_SIZE_ERROR_CODE)
    Object.setPrototypeOf(this, BufferSizeError.prototype)
  }
}

export class AddressIndexError extends AvalancheError {
  constructor(m: string) {
    super(m, ADDRESS_INDEX_ERROR_CODE)
    Object.setPrototypeOf(this, AddressIndexError.prototype)
  }
}

export class PublicKeyError extends AvalancheError {
  constructor(m: string) {
    super(m, PUBLIC_KEY_ERROR_CODE)
    Object.setPrototypeOf(this, PublicKeyError.prototype)
  }
}

export class MergeRuleError extends AvalancheError {
  constructor(m: string) {
    super(m, MERGE_RULE_ERROR_CODE)
    Object.setPrototypeOf(this, MergeRuleError.prototype)
  }
}

export class Base58Error extends AvalancheError {
  constructor(m: string) {
    super(m, BASE58_ERROR_CODE)
    Object.setPrototypeOf(this, Base58Error.prototype)
  }
}

export class PrivateKeyError extends AvalancheError {
  constructor(m: string) {
    super(m, PRIVATE_KEY_ERROR_CODE)
    Object.setPrototypeOf(this, PrivateKeyError.prototype)
  }
}

export class NodeIdError extends AvalancheError {
  constructor(m: string) {
    super(m, NODE_ID_ERROR_CODE)
    Object.setPrototypeOf(this, NodeIdError.prototype)
  }
}

export class HexError extends AvalancheError {
  constructor(m: string) {
    super(m, HEX_ERROR_CODE)
    Object.setPrototypeOf(this, HexError.prototype)
  }
}

export class TypeIdError extends AvalancheError {
  constructor(m: string) {
    super(m, TYPE_ID_ERROR_CODE)
    Object.setPrototypeOf(this, TypeIdError.prototype)
  }
}

export class TypeNameError extends AvalancheError {
  constructor(m: string) {
    super(m, TYPE_NAME_ERROR_CODE)
    Object.setPrototypeOf(this, TypeNameError.prototype)
  }
}

export class UnknownTypeError extends AvalancheError {
  constructor(m: string) {
    super(m, UNKNOWN_TYPE_ERROR_CODE)
    Object.setPrototypeOf(this, UnknownTypeError.prototype)
  }
}

export class Bech32Error extends AvalancheError {
  constructor(m: string) {
    super(m, BECH32_ERROR_CODE)
    Object.setPrototypeOf(this, Bech32Error.prototype)
  }
}

export class EVMFeeError extends AvalancheError {
  constructor(m: string) {
    super(m, EVM_FEE_ERROR_CODE)
    Object.setPrototypeOf(this, EVMFeeError.prototype)
  }
}

export class InvalidEntropy extends AvalancheError {
  constructor(m: string) {
    super(m, INVALID_ENTROPY)
    Object.setPrototypeOf(this, InvalidEntropy.prototype)
  }
}

export class ProtocolError extends AvalancheError {
  constructor(m: string) {
    super(m, PROTOCOL_ERROR_CODE)
    Object.setPrototypeOf(this, ProtocolError.prototype)
  }
}

export class SubnetIdError extends AvalancheError {
  constructor(m: string) {
    super(m, SUBNET_ID_ERROR_CODE)
    Object.setPrototypeOf(this, SubnetIdError.prototype)
  }
}

export class SubnetThresholdError extends AvalancheError {
  constructor(m: string) {
    super(m, SUBNET_THRESHOLD_ERROR_CODE)
    Object.setPrototypeOf(this, SubnetThresholdError.prototype)
  }
}

export class SubnetAddressError extends AvalancheError {
  constructor(m: string) {
    super(m, SUBNET_ADDRESS_ERROR_CODE)
    Object.setPrototypeOf(this, SubnetAddressError.prototype)
  }
}

export interface ErrorResponseObject {
  code: number
  message: string
  data?: null
}
