import BinTools from "../../../src/utils/bintools"
import { Buffer } from "buffer/"
import { PlatformVMConstants } from "../../../src/apis/platformvm/constants"
import { GenesisAsset, GenesisData } from "../../../src/index"
import { CreateChainTx, SubnetAuth } from "src/apis/platformvm"

describe("CreateChainTx", (): void => {
  /**
   * @ignore
   */
  const bintools: BinTools = BinTools.getInstance()

  const createChainTxHex: string =
    "0000053900000000000000000000000000000000000000000000000000000000000000000000000117cc8b1578ba383544d163958822d8abd3849bb9dfabe39fcbc3e7ee8811fe2f00000007006a94d6d80d6c00000000000000000000000001000000023cb7d3842e8cee6a0ebd09f1fe884f6861e1b29ca43c1f6ecdcb1fcec86d78446b9cf619c64c604b000000017fe044f9e97347c0a5ffe5a0f5773b42398c0e2b85948616da681585d460e1a80000000017cc8b1578ba383544d163958822d8abd3849bb9dfabe39fcbc3e7ee8811fe2f00000005006a94d713a836000000000100000000000000934d616e75616c6c7920637265617465206120437265617465436861696e54782077686963682063726561746573206120312d6f662d322041564158207574786f20616e6420696e7374616e746961746573206120564d20696e746f206120626c6f636b636861696e20627920636f72726563746c79207369676e696e672074686520322d6f662d33205375626e6574417574687fe044f9e97347c0a5ffe5a0f5773b42398c0e2b85948616da681585d460e1a80008455049432041564d61766d0000000000000000000000000000000000000000000000000000000000000000036e6674667800000000000000000000000000000000000000000000000000000070726f7065727479667800000000000000000000000000000000000000000000736563703235366b3166780000000000000000000000000000000000000000000000013c000000000001000e4173736574416c696173546573740000053900000000000000000000000000000000000000000000000000000000000000000000000000000000000000934d616e75616c6c7920637265617465206120437265617465436861696e54782077686963682063726561746573206120312d6f662d322041564158207574786f20616e6420696e7374616e746961746573206120564d20696e746f206120626c6f636b636861696e20627920636f72726563746c79207369676e696e672074686520322d6f662d33205375626e657441757468000a54657374204173736574000454455354000000000100000000000000010000000700000000000001fb000000000000000000000001000000023cb7d3842e8cee6a0ebd09f1fe884f6861e1b29ca43c1f6ecdcb1fcec86d78446b9cf619c64c604b0000000a000000020000000000000001"
  const createChainTxBuf: Buffer = Buffer.from(createChainTxHex, "hex")
  const createChainTx: CreateChainTx = new CreateChainTx()
  createChainTx.fromBuffer(createChainTxBuf)

  test("getTypeName", async (): Promise<void> => {
    const createChainTxTypeName: string = createChainTx.getTypeName()
    expect(createChainTxTypeName).toBe("CreateChainTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const createChainTxTypeID: number = createChainTx.getTypeID()
    expect(createChainTxTypeID).toBe(PlatformVMConstants.CREATECHAINTX)
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = createChainTx.toBuffer()
    const ccTx: CreateChainTx = new CreateChainTx()
    ccTx.fromBuffer(buf)
    const buf2: Buffer = ccTx.toBuffer()
    expect(buf.toString("hex")).toBe(buf2.toString("hex"))
  })

  test("getSubnetID", (): void => {
    const snID: string = "yKRV4EvGYWj7HHXUxSYzaAQVazEvaFPKPhJie4paqbrML5dub"
    const subnetID: string = createChainTx.getSubnetID()
    expect(subnetID).toBe(snID)
  })

  test("getChainName", (): void => {
    const cn: string = "EPIC AVM"
    const chainName: string = createChainTx.getChainName()
    expect(chainName).toBe(cn)
  })

  test("getVMID", (): void => {
    const vmIDHex: string =
      "61766d0000000000000000000000000000000000000000000000000000000000"
    const vmID: string = createChainTx.getVMID().toString("hex")
    expect(vmID).toBe(vmIDHex)
  })

  test("getFXIDs", (): void => {
    const fxIDsHex: string[] = [
      "6e66746678000000000000000000000000000000000000000000000000000000",
      "70726f7065727479667800000000000000000000000000000000000000000000",
      "736563703235366b316678000000000000000000000000000000000000000000"
    ]
    const fxIDs: Buffer[] = createChainTx.getFXIDs()
    expect(fxIDs.length).toBe(3)
    fxIDs.forEach((fxID: Buffer, index: number) => {
      expect(fxID.toString("hex")).toBe(fxIDsHex[index])
    })
  })

  test("getGenesisData", (): void => {
    const gd: string = createChainTx.getGenesisData()
    const genesisData: GenesisData = new GenesisData()
    const buf: Buffer = bintools.cb58Decode(gd)
    genesisData.fromBuffer(buf)
    const genesisAssets: GenesisAsset[] = genesisData.getGenesisAssets()
    const genesisAsset: GenesisAsset = genesisAssets[0]

    const n: string = "Test Asset"
    const name: string = genesisAsset.getName()
    expect(name).toBe(n)

    const s: string = "TEST"
    const symbol: string = genesisAsset.getSymbol()
    expect(symbol).toBe(s)

    const d: number = 0
    const denomination = genesisAsset.getDenomination()
    expect(denomination).toBe(d)
  })

  describe("SubnetAuth", (): void => {
    const sa: SubnetAuth = createChainTx.getSubnetAuth()

    test("getTypeName", async (): Promise<void> => {
      const subnetAuthTypeName: string = sa.getTypeName()
      expect(subnetAuthTypeName).toBe("SubnetAuth")
    })

    test("getTypeID", async (): Promise<void> => {
      const subnetAuthTypeID: number = sa.getTypeID()
      expect(subnetAuthTypeID).toBe(PlatformVMConstants.SUBNETAUTH)
    })

    test("getNumAddressIndices", async (): Promise<void> => {
      const numAddressIndices: number = sa.getNumAddressIndices()
      const nAI: number = 2
      expect(numAddressIndices).toBe(nAI)
    })

    test("addressIndices", async (): Promise<void> => {
      const ai: number[] = [0, 1]
      const addressIndices: Buffer[] = sa.getAddressIndices()
      addressIndices.forEach((addressIndex: Buffer, index: number) => {
        expect(addressIndex.readInt32BE(0)).toBe(ai[index])
      })
    })
  })
})
