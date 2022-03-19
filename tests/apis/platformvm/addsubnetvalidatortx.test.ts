import BinTools from "../../../src/utils/bintools"
import BN from "bn.js"
import { Buffer } from "buffer/"
import { AddSubnetValidatorTx, SubnetAuth } from "src/apis/platformvm"
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
  const addressIndex: Buffer = Buffer.alloc(4)
  addressIndex.writeUIntBE(0x0, 0, 4)
  const subnetAuth: SubnetAuth = new SubnetAuth([addressIndex])

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
    subnetID,
    subnetAuth
  )
  test("getNodeID", async (): Promise<void> => {
    const nodeIDBuf: Buffer = addSubnetValidatorTx.getNodeID()
    const nID: string = bufferToNodeIDString(nodeIDBuf)
    expect(nID).toBe(nodeID)
  })

  test("getStartTime", async (): Promise<void> => {
    const st: BN = addSubnetValidatorTx.getStartTime()
    expect(startTime.toString()).toBe(st.toString())
  })

  test("getEndTime", async (): Promise<void> => {
    const et: BN = addSubnetValidatorTx.getEndTime()
    expect(endTime.toString()).toBe(et.toString())
  })

  test("getWeight", async (): Promise<void> => {
    const w: BN = addSubnetValidatorTx.getWeight()
    expect(weight.toString()).toBe(w.toString())
  })

  test("getSubnetID", async (): Promise<void> => {
    const sID: string = addSubnetValidatorTx.getSubnetID()
    expect(subnetIDStr).toBe(sID)
  })
})
