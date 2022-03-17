import BN from "bn.js"
import { Buffer } from "buffer/"
import { SECPTransferOutput } from "../../../src/apis/avm/outputs"
import { InitialStates } from "../../../src/apis/avm/initialstates"
import { GenesisData, GenesisAsset, AVMConstants } from "../../../src/apis/avm"
import { Serialization, SerializedType } from "../../../src/utils"

/**
 * @ignore
 */
const serialization: Serialization = Serialization.getInstance()
describe("AVM", (): void => {
  test("GenesisData", (): void => {
    const networkID: number = 1337
    const m: string = "2Zc54v4ek37TEwu4LiV3j41PUMRd6acDDU3ZCVSxE7X"
    const cb58: SerializedType = "cb58"
    const memo: Buffer = serialization.typeToBuffer(m, cb58)
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
    const genesisAssets: GenesisAsset[] = [genesisAsset]
    const genesisData: GenesisData = new GenesisData(genesisAssets, networkID)
    const genesisData2: GenesisData = new GenesisData()
    genesisData2.fromBuffer(genesisData.toBuffer())
    expect(genesisData.toBuffer().toString("hex")).toBe(
      genesisData2.toBuffer().toString("hex")
    )
    expect(genesisData.getTypeName()).toBe("GenesisData")
    expect(genesisData.getTypeID()).toBeUndefined()
    expect(genesisData.getCodecID()).toBe(AVMConstants.LATESTCODEC)
    expect(genesisData.getNetworkID()).toBe(networkID)
    expect(genesisData.getGenesisAssets()).toStrictEqual(genesisAssets)
  })
})
