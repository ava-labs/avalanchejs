import BinTools from "../../../src/utils/bintools"
import BN from "bn.js"
import { Buffer } from "buffer/"
import { BaseTx, Vertex } from "src/apis/avm"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

describe("Vertex", (): void => {
  const hex: string =
    "0000ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c4b00000000002060e600000000000000018ed0be087be8cd4d0b3904015664e1532f3ee7bee4871ac68688b7626baf7e1d000000010000014f00000000000300000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c4b0000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff00000007000000003b7c458000000000000000000000000100000001ebb2b5051db1009cbd08a66c9d6ba69b5f98ed0f00000000000000000427d4b22a2a78bcddd456742caf91b56badbff985ee19aef14573e7343fd652000000017aa4d9cb609acaeef318e6d7974e8c03de90bedbf4ac96f78d3e4e51d52ea0c00000000021e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff00000005000000003b8b87c000000001000000000000000100000009000000016b71654daf1d5979cbac0ca0702d4facd25a90a24a567aed349407433fe8420c18ed425387b282c62bdc3c134625d6f4911051d9572acb8503e143c82089236101670b0a0b"
  const vertexBuf: Buffer = Buffer.from(hex, "hex")
  const vertex: Vertex = new Vertex()
  vertex.fromBuffer(vertexBuf)
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
    const txs: BaseTx[] = []
    const restrictionsBuf: Buffer = bintools.cb58Decode(
      "2kFgG4yE9S9wtAjoKJttuRtKvhFXxC3AoK9V6VssN18JqCL6YV"
    )
    const restrictions: string[] | Buffer[] = [restrictionsBuf]

    const vertex: Vertex = new Vertex(
      networkID,
      blockchainID,
      height,
      epoch,
      parentIDs,
      txs,
      restrictions
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
      const t: BaseTx[] = vertex.getTxs()
      expect(t).toBe(txs)
    })

    test("getRestrictions", (): void => {
      const r: Buffer[] = vertex.getRestrictions()
      expect(r).toEqual(restrictions)
    })
  })
})
