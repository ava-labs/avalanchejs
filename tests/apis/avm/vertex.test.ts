import BinTools from "../../../src/utils/bintools"
import BN from "bn.js"
import { Buffer } from "buffer/"
import { Vertex, Tx } from "src/apis/avm"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

describe("Vertex", (): void => {
  beforeEach((): void => {})
  describe("constructor", (): void => {
    const networkID: number = 1
    const blockchainID: string =
      "2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM"
    const height: BN = new BN(12345)
    const epoch: number = 0
    const parentIDBuf: Buffer = bintools.cb58Decode(
      "2HCoR1WzY3TEFipaxeyXhnKa4MYTjfUc4zN5SFhZHoTJGquVfp"
    )
    const parentIDs: Buffer[] = [parentIDBuf]
    const txs: Tx[] = []

    const vertex: Vertex = new Vertex(
      networkID,
      blockchainID,
      height,
      epoch,
      parentIDs,
      txs
    )

    test("getNetworkID", (): void => {
      const nID: number = vertex.getNetworkID()
      expect(nID).toBe(networkID)
    })

    test("getBlockchainID", (): void => {
      const bID: string = vertex.getBlockchainID()
      expect(bID).toBe(blockchainID)
    })

    test("getHeight", (): void => {
      const h: BN = vertex.getHeight()
      expect(h).toBe(height)
    })

    test("getEpoch", (): void => {
      const e: number = vertex.getEpoch()
      expect(e).toBe(epoch)
    })

    test("getParentIDs", (): void => {
      const pIDs: Buffer[] = vertex.getParentIDs()
      expect(pIDs).toEqual(parentIDs)
    })

    test("getTxs", (): void => {
      const t: Tx[] = vertex.getTxs()
      expect(t).toBe(txs)
    })

    test("toBuffer", (): void => {
      const b: Buffer = vertex.toBuffer()
      const v: Vertex = new Vertex()
      v.fromBuffer(b)
      expect(v.toBuffer().toString("hex")).toEqual(
        vertex.toBuffer().toString("hex")
      )
    })
  })
})
