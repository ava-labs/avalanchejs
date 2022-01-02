import BinTools from "../../src/utils/bintools"
import {
  AvalancheError,
  AddressError,
  GooseEggCheckError,
  ChainIdError,
  NoAtomicUTXOsError,
  SymbolError,
  NameError,
  TransactionError,
  CodecIdError,
  CredIdError,
  TransferableOutputError,
  TransferableInputError,
  InputIdError,
  OperationError,
  InvalidOperationIdError,
  ChecksumError,
  OutputIdError,
  UTXOError,
  InsufficientFundsError,
  ThresholdError,
  SECPMintOutputError,
  EVMInputError,
  EVMOutputError,
  FeeAssetError,
  StakeError,
  TimeError,
  DelegationFeeError,
  SubnetOwnerError,
  BufferSizeError,
  AddressIndexError,
  PublicKeyError,
  MergeRuleError,
  Base58Error,
  PrivateKeyError,
  NodeIdError,
  HexError,
  TypeIdError,
  TypeNameError,
  UnknownTypeError,
  Bech32Error,
  EVMFeeError,
  InvalidEntropy,
  ProtocolError,
  SubnetIdError
} from "src/utils"

describe("Errors", (): void => {
  test("AvalancheError", (): void => {
    try {
      throw new AvalancheError("Testing AvalancheError", "0")
    } catch (error: any) {
      expect(error.getCode()).toBe("0")
    }
    expect((): void => {
      throw new AvalancheError("Testing AvalancheError", "0")
    }).toThrow("Testing AvalancheError")
    expect((): void => {
      throw new AvalancheError("Testing AvalancheError", "0")
    }).toThrowError()
  })

  test("AddressError", (): void => {
    try {
      throw new AddressError("Testing AddressError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1000")
    }
    expect((): void => {
      throw new AddressError("Testing AddressError")
    }).toThrow("Testing AddressError")
    expect((): void => {
      throw new AddressError("Testing AddressError")
    }).toThrowError()
  })

  test("GooseEggCheckError", (): void => {
    try {
      throw new GooseEggCheckError("Testing GooseEggCheckError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1001")
    }
    expect((): void => {
      throw new GooseEggCheckError("Testing GooseEggCheckError")
    }).toThrow("Testing GooseEggCheckError")
    expect((): void => {
      throw new GooseEggCheckError("Testing GooseEggCheckError")
    }).toThrowError()
  })

  test("ChainIdError", (): void => {
    try {
      throw new ChainIdError("Testing ChainIdError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1002")
    }
    expect((): void => {
      throw new ChainIdError("Testing ChainIdError")
    }).toThrow("Testing ChainIdError")
    expect((): void => {
      throw new ChainIdError("Testing ChainIdError")
    }).toThrowError()
  })

  test("NoAtomicUTXOsError", (): void => {
    try {
      throw new NoAtomicUTXOsError("Testing NoAtomicUTXOsError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1003")
    }
    expect((): void => {
      throw new NoAtomicUTXOsError("Testing NoAtomicUTXOsError")
    }).toThrow("Testing NoAtomicUTXOsError")
    expect((): void => {
      throw new NoAtomicUTXOsError("Testing NoAtomicUTXOsError")
    }).toThrowError()
  })

  test("SymbolError", (): void => {
    try {
      throw new SymbolError("Testing SymbolError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1004")
    }
    expect((): void => {
      throw new SymbolError("Testing SymbolError")
    }).toThrow("Testing SymbolError")
    expect((): void => {
      throw new SymbolError("Testing SymbolError")
    }).toThrowError()
  })

  test("NameError", (): void => {
    try {
      throw new NameError("Testing NameError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1005")
    }
    expect((): void => {
      throw new NameError("Testing NameError")
    }).toThrow("Testing NameError")
    expect((): void => {
      throw new NameError("Testing NameError")
    }).toThrowError()
  })

  test("TransactionError", (): void => {
    try {
      throw new TransactionError("Testing TransactionError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1006")
    }
    expect((): void => {
      throw new TransactionError("Testing TransactionError")
    }).toThrow("Testing TransactionError")
    expect((): void => {
      throw new TransactionError("Testing TransactionError")
    }).toThrowError()
  })

  test("CodecIdError", (): void => {
    try {
      throw new CodecIdError("Testing CodecIdError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1007")
    }
    expect((): void => {
      throw new CodecIdError("Testing CodecIdError")
    }).toThrow("Testing CodecIdError")
    expect((): void => {
      throw new CodecIdError("Testing CodecIdError")
    }).toThrowError()
  })

  test("CredIdError", (): void => {
    try {
      throw new CredIdError("Testing CredIdError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1008")
    }
    expect((): void => {
      throw new CredIdError("Testing CredIdError")
    }).toThrow("Testing CredIdError")
    expect((): void => {
      throw new CredIdError("Testing CredIdError")
    }).toThrowError()
  })

  test("TransferableOutputError", (): void => {
    try {
      throw new TransferableOutputError("Testing TransferableOutputError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1009")
    }
    expect((): void => {
      throw new TransferableOutputError("Testing TransferableOutputError")
    }).toThrow("Testing TransferableOutputError")
    expect((): void => {
      throw new TransferableOutputError("Testing TransferableOutputError")
    }).toThrowError()
  })

  test("TransferableInputError", (): void => {
    try {
      throw new TransferableInputError("Testing TransferableInputError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1010")
    }
    expect((): void => {
      throw new TransferableInputError("Testing TransferableInputError")
    }).toThrow("Testing TransferableInputError")
    expect((): void => {
      throw new TransferableInputError("Testing TransferableInputError")
    }).toThrowError()
  })

  test("InputIdError", (): void => {
    try {
      throw new InputIdError("Testing InputIdError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1011")
    }
    expect((): void => {
      throw new InputIdError("Testing InputIdError")
    }).toThrow("Testing InputIdError")
    expect((): void => {
      throw new InputIdError("Testing InputIdError")
    }).toThrowError()
  })

  test("OperationError", (): void => {
    try {
      throw new OperationError("Testing OperationError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1012")
    }
    expect((): void => {
      throw new OperationError("Testing OperationError")
    }).toThrow("Testing OperationError")
    expect((): void => {
      throw new OperationError("Testing OperationError")
    }).toThrowError()
  })

  test("InvalidOperationIdError", (): void => {
    try {
      throw new InvalidOperationIdError("Testing InvalidOperationIdError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1013")
    }
    expect((): void => {
      throw new InvalidOperationIdError("Testing InvalidOperationIdError")
    }).toThrow("Testing InvalidOperationIdError")
    expect((): void => {
      throw new InvalidOperationIdError("Testing InvalidOperationIdError")
    }).toThrowError()
  })

  test("ChecksumError", (): void => {
    try {
      throw new ChecksumError("Testing ChecksumError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1014")
    }
    expect((): void => {
      throw new ChecksumError("Testing ChecksumError")
    }).toThrow("Testing ChecksumError")
    expect((): void => {
      throw new ChecksumError("Testing ChecksumError")
    }).toThrowError()
  })

  test("OutputIdError", (): void => {
    try {
      throw new OutputIdError("Testing OutputIdError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1015")
    }
    expect((): void => {
      throw new OutputIdError("Testing OutputIdError")
    }).toThrow("Testing OutputIdError")
    expect((): void => {
      throw new OutputIdError("Testing OutputIdError")
    }).toThrowError()
  })

  test("UTXOError", (): void => {
    try {
      throw new UTXOError("Testing UTXOError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1016")
    }
    expect((): void => {
      throw new UTXOError("Testing UTXOError")
    }).toThrow("Testing UTXOError")
    expect((): void => {
      throw new UTXOError("Testing UTXOError")
    }).toThrowError()
  })

  test("InsufficientFundsError", (): void => {
    try {
      throw new InsufficientFundsError("Testing InsufficientFundsError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1017")
    }
    expect((): void => {
      throw new InsufficientFundsError("Testing InsufficientFundsError")
    }).toThrow("Testing InsufficientFundsError")
    expect((): void => {
      throw new InsufficientFundsError("Testing InsufficientFundsError")
    }).toThrowError()
  })

  test("ThresholdError", (): void => {
    try {
      throw new ThresholdError("Testing ThresholdError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1018")
    }
    expect((): void => {
      throw new ThresholdError("Testing ThresholdError")
    }).toThrow("Testing ThresholdError")
    expect((): void => {
      throw new ThresholdError("Testing ThresholdError")
    }).toThrowError()
  })

  test("SECPMintOutputError", (): void => {
    try {
      throw new SECPMintOutputError("Testing SECPMintOutputError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1019")
    }
    expect((): void => {
      throw new SECPMintOutputError("Testing SECPMintOutputError")
    }).toThrow("Testing SECPMintOutputError")
    expect((): void => {
      throw new SECPMintOutputError("Testing SECPMintOutputError")
    }).toThrowError()
  })

  test("EVMInputError", (): void => {
    try {
      throw new EVMInputError("Testing EVMInputError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1020")
    }
    expect((): void => {
      throw new EVMInputError("Testing EVMInputError")
    }).toThrow("Testing EVMInputError")
    expect((): void => {
      throw new EVMInputError("Testing EVMInputError")
    }).toThrowError()
  })

  test("EVMOutputError", (): void => {
    try {
      throw new EVMOutputError("Testing EVMOutputError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1021")
    }
    expect((): void => {
      throw new EVMOutputError("Testing EVMOutputError")
    }).toThrow("Testing EVMOutputError")
    expect((): void => {
      throw new EVMOutputError("Testing EVMOutputError")
    }).toThrowError()
  })

  test("FeeAssetError", (): void => {
    try {
      throw new FeeAssetError("Testing FeeAssetError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1022")
    }
    expect((): void => {
      throw new FeeAssetError("Testing FeeAssetError")
    }).toThrow("Testing FeeAssetError")
    expect((): void => {
      throw new FeeAssetError("Testing FeeAssetError")
    }).toThrowError()
  })

  test("StakeError", (): void => {
    try {
      throw new StakeError("Testing StakeError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1023")
    }
    expect((): void => {
      throw new StakeError("Testing StakeError")
    }).toThrow("Testing StakeError")
    expect((): void => {
      throw new StakeError("Testing StakeError")
    }).toThrowError()
  })

  test("TimeError", (): void => {
    try {
      throw new TimeError("Testing TimeError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1024")
    }
    expect((): void => {
      throw new TimeError("Testing TimeError")
    }).toThrow("Testing TimeError")
    expect((): void => {
      throw new TimeError("Testing TimeError")
    }).toThrowError()
  })

  test("DelegationFeeError", (): void => {
    try {
      throw new DelegationFeeError("Testing DelegationFeeError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1025")
    }
    expect((): void => {
      throw new DelegationFeeError("Testing DelegationFeeError")
    }).toThrow("Testing DelegationFeeError")
    expect((): void => {
      throw new DelegationFeeError("Testing DelegationFeeError")
    }).toThrowError()
  })

  test("SubnetOwnerError", (): void => {
    try {
      throw new SubnetOwnerError("Testing SubnetOwnerError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1026")
    }
    expect((): void => {
      throw new SubnetOwnerError("Testing SubnetOwnerError")
    }).toThrow("Testing SubnetOwnerError")
    expect((): void => {
      throw new SubnetOwnerError("Testing SubnetOwnerError")
    }).toThrowError()
  })

  test("BufferSizeError", (): void => {
    try {
      throw new BufferSizeError("Testing BufferSizeError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1027")
    }
    expect((): void => {
      throw new BufferSizeError("Testing BufferSizeError")
    }).toThrow("Testing BufferSizeError")
    expect((): void => {
      throw new BufferSizeError("Testing BufferSizeError")
    }).toThrowError()
  })

  test("AddressIndexError", (): void => {
    try {
      throw new AddressIndexError("Testing AddressIndexError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1028")
    }
    expect((): void => {
      throw new AddressIndexError("Testing AddressIndexError")
    }).toThrow("Testing AddressIndexError")
    expect((): void => {
      throw new AddressIndexError("Testing AddressIndexError")
    }).toThrowError()
  })

  test("PublicKeyError", (): void => {
    try {
      throw new PublicKeyError("Testing PublicKeyError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1029")
    }
    expect((): void => {
      throw new PublicKeyError("Testing PublicKeyError")
    }).toThrow("Testing PublicKeyError")
    expect((): void => {
      throw new PublicKeyError("Testing PublicKeyError")
    }).toThrowError()
  })

  test("MergeRuleError", (): void => {
    try {
      throw new MergeRuleError("Testing MergeRuleError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1030")
    }
    expect((): void => {
      throw new MergeRuleError("Testing MergeRuleError")
    }).toThrow("Testing MergeRuleError")
    expect((): void => {
      throw new MergeRuleError("Testing MergeRuleError")
    }).toThrowError()
  })

  test("Base58Error", (): void => {
    try {
      throw new Base58Error("Testing Base58Error")
    } catch (error: any) {
      expect(error.getCode()).toBe("1031")
    }
    expect((): void => {
      throw new Base58Error("Testing Base58Error")
    }).toThrow("Testing Base58Error")
    expect((): void => {
      throw new Base58Error("Testing Base58Error")
    }).toThrowError()
  })

  test("PrivateKeyError", (): void => {
    try {
      throw new PrivateKeyError("Testing PrivateKeyError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1032")
    }
    expect((): void => {
      throw new PrivateKeyError("Testing PrivateKeyError")
    }).toThrow("Testing PrivateKeyError")
    expect((): void => {
      throw new PrivateKeyError("Testing PrivateKeyError")
    }).toThrowError()
  })

  test("NodeIdError", (): void => {
    try {
      throw new NodeIdError("Testing NodeIdError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1033")
    }
    expect((): void => {
      throw new NodeIdError("Testing NodeIdError")
    }).toThrow("Testing NodeIdError")
    expect((): void => {
      throw new NodeIdError("Testing NodeIdError")
    }).toThrowError()
  })

  test("HexError", (): void => {
    try {
      throw new HexError("Testing HexError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1034")
    }
    expect((): void => {
      throw new HexError("Testing HexError")
    }).toThrow("Testing HexError")
    expect((): void => {
      throw new HexError("Testing HexError")
    }).toThrowError()
  })

  test("TypeIdError", (): void => {
    try {
      throw new TypeIdError("Testing TypeIdError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1035")
    }
    expect((): void => {
      throw new TypeIdError("Testing TypeIdError")
    }).toThrow("Testing TypeIdError")
    expect((): void => {
      throw new TypeIdError("Testing TypeIdError")
    }).toThrowError()
  })

  test("TypeNameError", (): void => {
    try {
      throw new TypeNameError("Testing TypeNameError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1042")
    }
    expect((): void => {
      throw new TypeNameError("Testing TypeNameError")
    }).toThrow("Testing TypeNameError")
    expect((): void => {
      throw new TypeNameError("Testing TypeNameError")
    }).toThrowError()
  })

  test("UnknownTypeError", (): void => {
    try {
      throw new UnknownTypeError("Testing UnknownTypeError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1036")
    }
    expect((): void => {
      throw new UnknownTypeError("Testing UnknownTypeError")
    }).toThrow("Testing UnknownTypeError")
    expect((): void => {
      throw new UnknownTypeError("Testing UnknownTypeError")
    }).toThrowError()
  })

  test("Bech32Error", (): void => {
    try {
      throw new Bech32Error("Testing Bech32Error")
    } catch (error: any) {
      expect(error.getCode()).toBe("1037")
    }
    expect((): void => {
      throw new Bech32Error("Testing Bech32Error")
    }).toThrow("Testing Bech32Error")
    expect((): void => {
      throw new Bech32Error("Testing Bech32Error")
    }).toThrowError()
  })

  test("EVMFeeError", (): void => {
    try {
      throw new EVMFeeError("Testing EVMFeeError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1038")
    }
    expect((): void => {
      throw new EVMFeeError("Testing EVMFeeError")
    }).toThrow("Testing EVMFeeError")
    expect((): void => {
      throw new EVMFeeError("Testing EVMFeeError")
    }).toThrowError()
  })

  test("InvalidEntropy", (): void => {
    try {
      throw new InvalidEntropy("Testing InvalidEntropy")
    } catch (error: any) {
      expect(error.getCode()).toBe("1039")
    }
    expect((): void => {
      throw new InvalidEntropy("Testing InvalidEntropy")
    }).toThrow("Testing InvalidEntropy")
    expect((): void => {
      throw new InvalidEntropy("Testing InvalidEntropy")
    }).toThrowError()
  })

  test("ProtocolError", (): void => {
    try {
      throw new ProtocolError("Testing ProtocolError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1040")
    }
    expect((): void => {
      throw new ProtocolError("Testing ProtocolError")
    }).toThrow("Testing ProtocolError")
    expect((): void => {
      throw new ProtocolError("Testing ProtocolError")
    }).toThrowError()
  })

  test("SubnetIdError", (): void => {
    try {
      throw new SubnetIdError("Testing SubnetIdError")
    } catch (error: any) {
      expect(error.getCode()).toBe("1041")
    }
    expect((): void => {
      throw new SubnetIdError("Testing SubnetIdError")
    }).toThrow("Testing SubnetIdError")
    expect((): void => {
      throw new SubnetIdError("Testing SubnetIdError")
    }).toThrowError()
  })
})
