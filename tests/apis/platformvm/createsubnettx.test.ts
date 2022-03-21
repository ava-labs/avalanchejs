import BinTools from "../../../src/utils/bintools"
import BN from "bn.js"
import { Buffer } from "buffer/"
import { SECPOwnerOutput } from "../../../src/apis/platformvm/outputs"
import { PlatformVMConstants } from "../../../src/apis/platformvm/constants"
import { CreateSubnetTx } from "src/apis/platformvm"

describe("CreateSubnetTx", (): void => {
  /**
   * @ignore
   */
  const bintools: BinTools = BinTools.getInstance()
  const networkID: number = 1337
  const pChainBlockchainID: string = "11111111111111111111111111111111LpoYY"
  const memoStr: string = "from snowflake to avalanche"
  const memo: Buffer = Buffer.from(memoStr, "utf8")
  const bID: Buffer = bintools.cb58Decode(pChainBlockchainID)
  const addys: Buffer[] = []
  const lt: BN = new BN(0)
  const t: number = 1
  const subnetOwners: SECPOwnerOutput = new SECPOwnerOutput(addys, lt, t)
  const createSubnetTx = new CreateSubnetTx(
    networkID,
    bID,
    [],
    [],
    memo,
    subnetOwners
  )

  test("getTypeID", async (): Promise<void> => {
    expect(createSubnetTx.getTypeID()).toBe(PlatformVMConstants.CREATESUBNETTX)
  })

  test("getSubnetOwners", async (): Promise<void> => {
    const subnetOwners: SECPOwnerOutput = createSubnetTx.getSubnetOwners()
    const threshold: number = 1
    const l: BN = subnetOwners.getLocktime()
    const lt: BN = new BN(0)
    expect(l.toNumber()).toBe(lt.toNumber())
    expect(subnetOwners.getThreshold()).toBe(threshold)

    const outputID: number = subnetOwners.getOutputID()
    expect(outputID).toBe(PlatformVMConstants.SECPOWNEROUTPUTID)

    const addresses: Buffer[] = subnetOwners.getAddresses()
    const addrLen: number = 0
    expect(addresses.length).toBe(addrLen)
  })
})
