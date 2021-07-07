import BN from "bn.js"
import { Buffer } from "buffer/"
import { SECPTransferOutput, TransferableOutput } from "src/apis/avm/outputs"
import { InitialStates } from "src/apis/avm/initialstates"
import { GenesisData, GenesisAsset, TransferableInput, AVMConstants } from "src/apis/avm"
import { Serialization, SerializedEncoding, SerializedType } from "src/utils"

/**
 * @ignore
 */
const serialization: Serialization = Serialization.getInstance()
describe("AVM", (): void => {
  test("GenesisData", (): void => {
    const networkID: number = 12345
    const m: string = "2Zc54v4ek37TEwu4LiV3j41PUMRd6acDDU3ZCVSxE7X"
    const mHex: string = "66726f6d20736e6f77666c616b6520746f206176616c616e636865"
    const memo: Buffer = serialization.typeToBuffer(m, "cb58")
    const hex: SerializedEncoding = "hex"
    const amount: BN = new BN(100000)
    const address: string = "X-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u00z96u"
    const bech32: SerializedType = "bech32"
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
    const genesisAsset: GenesisAsset = new GenesisAsset(assetAlias, name, symbol, denomination, initialStates, memo)
    const genesisAssets: GenesisAsset[] = [genesisAsset]
    const genesisData: GenesisData = new GenesisData(genesisAssets, networkID)
    expect(genesisData.getTypeName()).toBe("GenesisData")
    expect(genesisData.getTypeID()).toBeUndefined()
    expect(genesisData.getCodecID()).toBe(AVMConstants.LATESTCODEC)
    expect(genesisData.getNetworkID()).toBe(networkID)
    // expect(serialization.bufferToType(genesisData.toBuffer(), "cb58")).toBe(networkID)
    //   expect(genesisData.getName()).toBe(name)
    //   expect(genesisData.getAssetAlias()).toBe(assetAlias)
    //   expect(genesisData.getSymbol()).toBe(symbol)
    //   expect(genesisData.getDenomination()).toBe(denomination)
    //   expect(genesisData.getBlockchainID().toString(hex)).toBe("1010101010101010101010101010101010101010101010101010101010101010")
    //   expect(genesisData.getIns()).toEqual(outs)
    //   expect(genesisData.getOuts()).toEqual(ins)
    //   expect(genesisData.getInitialStates()).toStrictEqual(initialStates)
    //   expect(genesisData.getMemo().toString(hex)).toBe(mHex)
  })
})
