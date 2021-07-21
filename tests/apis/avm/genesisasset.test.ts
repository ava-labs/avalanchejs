import BN from "bn.js"
import { Buffer } from "buffer/"
import {
  SECPTransferOutput,
  TransferableOutput
} from "../../../src/apis/avm/outputs"
import { InitialStates } from "../../../src/apis/avm/initialstates"
import { GenesisAsset, TransferableInput } from "../../../src/apis/avm"
import {
  DefaultNetworkID,
  Serialization,
  SerializedEncoding,
  SerializedType
} from "../../../src/utils"

/**
 * @ignore
 */
const serialization: Serialization = Serialization.getInstance()
describe("AVM", (): void => {
  test("GenesisAsset", (): void => {
    const m: string = "2Zc54v4ek37TEwu4LiV3j41PUMRd6acDDU3ZCVSxE7X"
    const mHex: string =
      "66726f6d20736e6f77666c616b6520746f206176616c616e636865"
    const blockchainIDHex: string =
      "0000000000000000000000000000000000000000000000000000000000000000"
    const hex: SerializedEncoding = "hex"
    const cb58: SerializedType = "cb58"
    const bech32: SerializedType = "bech32"
    const memo: Buffer = serialization.typeToBuffer(m, cb58)
    const amount: BN = new BN(0)
    const address: string = "X-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u00z96u"
    const addressBuf: Buffer = serialization.typeToBuffer(address, bech32)
    const threshold: number = 1
    const locktime: BN = new BN(0)
    const assetAlias: string = "asset1"
    const name: string = "asset1"
    const symbol: string = "MFCA"
    const denomination: number = 1
    const outs: TransferableOutput[] = []
    const ins: TransferableInput[] = []
    const vcapSecpOutput = new SECPTransferOutput(
      amount,
      [addressBuf],
      locktime,
      threshold
    )
    const initialStates: InitialStates = new InitialStates()
    initialStates.addOutput(vcapSecpOutput)
    const genesisAsset: GenesisAsset = new GenesisAsset(
      assetAlias,
      name,
      symbol,
      denomination,
      initialStates,
      memo
    )
    const genesisAsset2: GenesisAsset = new GenesisAsset()
    genesisAsset2.fromBuffer(genesisAsset.toBuffer())
    expect(genesisAsset.toBuffer().toString("hex")).toBe(
      genesisAsset2.toBuffer().toString("hex")
    )
    expect(genesisAsset.getTypeName()).toBe("GenesisAsset")
    expect(genesisAsset.getTypeID()).toBeUndefined()
    expect(genesisAsset.getCodecID()).toBeUndefined()
    expect(genesisAsset.getNetworkID()).toBe(DefaultNetworkID)
    expect(genesisAsset.getName()).toBe(name)
    expect(genesisAsset.getAssetAlias()).toBe(assetAlias)
    expect(genesisAsset.getSymbol()).toBe(symbol)
    expect(genesisAsset.getDenomination()).toBe(denomination)
    expect(genesisAsset.getBlockchainID().toString(hex)).toBe(blockchainIDHex)
    expect(genesisAsset.getIns()).toEqual(outs)
    expect(genesisAsset.getOuts()).toEqual(ins)
    expect(genesisAsset.getInitialStates()).toStrictEqual(initialStates)
    expect(genesisAsset.getMemo().toString(hex)).toBe(mHex)
  })
})
