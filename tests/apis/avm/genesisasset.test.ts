import BN from "bn.js"
import { Buffer } from "buffer/"
import { SECPTransferOutput, TransferableOutput } from "src/apis/avm/outputs"
import { InitialStates } from "src/apis/avm/initialstates"
import { GenesisAsset, TransferableInput } from "src/apis/avm"
import { DefaultNetworkID, Serialization, SerializedEncoding, SerializedType } from "src/utils"

/**
 * @ignore
 */
const serialization: Serialization = Serialization.getInstance()
describe("AVM", (): void => {
  test("GenesisAsset", (): void => {
    const m: string = "2Zc54v4ek37TEwu4LiV3j41PUMRd6acDDU3ZCVSxE7X"
    const mHex: string = "66726f6d20736e6f77666c616b6520746f206176616c616e636865"
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
    const vcapSecpOutput = new SECPTransferOutput(amount, [addressBuf], locktime, threshold)
    const initialStates: InitialStates = new InitialStates()
    initialStates.addOutput(vcapSecpOutput)
    const genesisasset: GenesisAsset = new GenesisAsset(assetAlias, name, symbol, denomination, initialStates, memo)
    expect(genesisasset.getTypeName()).toBe("GenesisAsset")
    expect(genesisasset.getTypeID()).toBeUndefined()
    expect(genesisasset.getCodecID()).toBeUndefined()
    expect(genesisasset.getNetworkID()).toBe(DefaultNetworkID)
    expect(genesisasset.getName()).toBe(name)
    expect(genesisasset.getAssetAlias()).toBe(assetAlias)
    expect(genesisasset.getSymbol()).toBe(symbol)
    expect(genesisasset.getDenomination()).toBe(denomination)
    expect(genesisasset.getBlockchainID().toString(hex)).toBe("1010101010101010101010101010101010101010101010101010101010101010")
    expect(genesisasset.getIns()).toEqual(outs)
    expect(genesisasset.getOuts()).toEqual(ins)
    expect(genesisasset.getInitialStates()).toStrictEqual(initialStates)
    expect(genesisasset.getMemo().toString(hex)).toBe(mHex)
  })
})
