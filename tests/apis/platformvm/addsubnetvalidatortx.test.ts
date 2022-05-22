import BN from "bn.js"
import { Buffer } from "buffer/"
import { BinTools } from "src"
import {
  AddSubnetValidatorTx,
  PlatformVMConstants,
  SubnetAuth
} from "src/apis/platformvm"
import { bufferToNodeIDString, NodeIDStringToBuffer } from "src/utils"

describe("AddSubnetValidatorTx", (): void => {
  /**
   * @ignore
   */
   const bintools: BinTools = BinTools.getInstance()

   const networkID: number = 1337
   const pChainBlockchainID: string = "11111111111111111111111111111111LpoYY"
   const memoStr: string = "from snowflake to avalanche"
   const memo: Buffer = Buffer.from(memoStr, "utf8")
 
   const bID: Buffer = bintools.cb58Decode(pChainBlockchainID)
 
   const nodeID: string = "NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg"
   const nodeIDBuf: Buffer = NodeIDStringToBuffer(nodeID)
   const startTime: BN = new BN(1647654984)
   const endTime: BN = new BN(1648950865)
   const weight: BN = new BN(20)
 
   const subnetIDStr: string =
     "WYziRrZeZVftQ56QizLxmSfwofLyJM8u3uYbRHA1Yc7YtMmbN"
   const subnetID: string | Buffer = bintools.cb58Decode(subnetIDStr)
 
   const addSubnetValidatorTx = new AddSubnetValidatorTx(
     networkID,
     bID,
     [],
     [],
     memo,
     nodeIDBuf,
     startTime,
     endTime,
     weight,
     subnetID
   )

  test("getTypeName", async (): Promise<void> => {
    const addSubnetValidatorTxTypeName: string =
      addSubnetValidatorTx.getTypeName()
    expect(addSubnetValidatorTxTypeName).toBe("AddSubnetValidatorTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const addSubnetValidatorTxTypeID: number = addSubnetValidatorTx.getTypeID()
    expect(addSubnetValidatorTxTypeID).toBe(
      PlatformVMConstants.ADDSUBNETVALIDATORTX
    )
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = addSubnetValidatorTx.toBuffer()
    const asvTx: AddSubnetValidatorTx = new AddSubnetValidatorTx()
    asvTx.fromBuffer(buf)
    const buf2: Buffer = asvTx.toBuffer()
    expect(buf.toString("hex")).toBe(buf2.toString("hex"))
  })

  test("getNodeID", async (): Promise<void> => {
    const nodeID: string = "NodeID-MFrZFVCXPv5iCn6M9K6XduxGTYp891xXZ"
    const nodeIDBuf: Buffer = addSubnetValidatorTx.getNodeID()
    const nID: string = bufferToNodeIDString(nodeIDBuf)
    expect(nID).toBe(nodeID)
  })

  test("getStartTime", async (): Promise<void> => {
    const startTime: BN = new BN(1652156316)
    const st: BN = addSubnetValidatorTx.getStartTime()
    expect(startTime.toString()).toBe(st.toString())
  })

  test("getEndTime", async (): Promise<void> => {
    const endTime: BN = new BN(1653442362)
    const et: BN = addSubnetValidatorTx.getEndTime()
    expect(endTime.toString()).toBe(et.toString())
  })

  test("getWeight", async (): Promise<void> => {
    const weight: BN = new BN(1)
    const w: BN = addSubnetValidatorTx.getWeight()
    expect(weight.toString()).toBe(w.toString())
  })

  test("getSubnetID", async (): Promise<void> => {
    const subnetID: string = "yKRV4EvGYWj7HHXUxSYzaAQVazEvaFPKPhJie4paqbrML5dub"
    const sID: string = addSubnetValidatorTx.getSubnetID()
    expect(subnetID).toBe(sID)
  })

  describe("SubnetAuth", (): void => {
    const sa: SubnetAuth = addSubnetValidatorTx.getSubnetAuth()

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
