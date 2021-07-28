import { UTXO } from "../../../src/apis/avm/utxos"
import createHash from "create-hash"
import BinTools from "../../../src/utils/bintools"
import BN from "bn.js"
import { Buffer } from "buffer/"
import { NFTTransferOutput } from "../../../src/apis/avm/outputs"
import { AVMConstants } from "../../../src/apis/avm/constants"
import {
  SelectOperationClass,
  Operation,
  TransferableOperation,
  NFTTransferOperation,
  NFTMintOperation
} from "../../../src/apis/avm/ops"
import { OutputOwners } from "../../../src/common/output"
import { SigIdx } from "../../../src/common/credentials"
import { UTXOID } from "../../../src/apis/avm/ops"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

describe("Operations", (): void => {
  const codecID_zero: number = 0
  const codecID_one: number = 1
  const assetID: string =
    "8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533"
  const assetIDBuff: Buffer = Buffer.from(assetID, "hex")
  const addrs: Buffer[] = [
    bintools.cb58Decode("B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW"),
    bintools.cb58Decode("P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF"),
    bintools.cb58Decode("6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV")
  ].sort()

  const locktime: BN = new BN(54321)

  const payload: Buffer = Buffer.alloc(1024)
  payload.write(
    "All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.",
    0,
    1024,
    "utf8"
  )

  describe("NFTMintOperation", (): void => {
    test("SelectOperationClass", (): void => {
      const goodop: NFTMintOperation = new NFTMintOperation(
        0,
        Buffer.from(""),
        []
      )
      const operation: Operation = SelectOperationClass(goodop.getOperationID())
      expect(operation).toBeInstanceOf(NFTMintOperation)
      expect(() => {
        SelectOperationClass(99)
      }).toThrow("Error - SelectOperationClass: unknown opid")
    })

    test("comparator", (): void => {
      const outputOwners: OutputOwners[] = []
      outputOwners.push(new OutputOwners(addrs, locktime, 1))
      const op1: NFTMintOperation = new NFTMintOperation(
        1,
        payload,
        outputOwners
      )
      const op2: NFTMintOperation = new NFTMintOperation(
        2,
        payload,
        outputOwners
      )
      const op3: NFTMintOperation = new NFTMintOperation(
        0,
        payload,
        outputOwners
      )
      const cmp = NFTMintOperation.comparator()
      expect(cmp(op1, op1)).toBe(0)
      expect(cmp(op2, op2)).toBe(0)
      expect(cmp(op3, op3)).toBe(0)
      expect(cmp(op1, op2)).toBe(-1)
      expect(cmp(op1, op3)).toBe(1)
    })

    test("Functionality", (): void => {
      const outputOwners: OutputOwners[] = []
      outputOwners.push(new OutputOwners(addrs, locktime, 1))
      const op: NFTMintOperation = new NFTMintOperation(
        0,
        payload,
        outputOwners
      )

      expect(op.getOperationID()).toBe(AVMConstants.NFTMINTOPID)
      expect(op.getOutputOwners().toString()).toBe(outputOwners.toString())

      const opcopy: NFTMintOperation = new NFTMintOperation()
      const opb: Buffer = op.toBuffer()
      opcopy.fromBuffer(opb)
      expect(opcopy.toString()).toBe(op.toString())
    })

    test("NFTMintOperation codecIDs", (): void => {
      const outputOwners: OutputOwners[] = []
      outputOwners.push(new OutputOwners(addrs, locktime, 1))
      const nftMintOperation: NFTMintOperation = new NFTMintOperation(
        0,
        payload,
        outputOwners
      )
      expect(nftMintOperation.getCodecID()).toBe(codecID_zero)
      expect(nftMintOperation.getOperationID()).toBe(AVMConstants.NFTMINTOPID)
      nftMintOperation.setCodecID(codecID_one)
      expect(nftMintOperation.getCodecID()).toBe(codecID_one)
      expect(nftMintOperation.getOperationID()).toBe(
        AVMConstants.NFTMINTOPID_CODECONE
      )
      nftMintOperation.setCodecID(codecID_zero)
      expect(nftMintOperation.getCodecID()).toBe(codecID_zero)
      expect(nftMintOperation.getOperationID()).toBe(AVMConstants.NFTMINTOPID)
    })

    test("Invalid NFTMintOperation codecID", (): void => {
      const outputOwners: OutputOwners[] = []
      outputOwners.push(new OutputOwners(addrs, locktime, 1))
      const nftMintOperation: NFTMintOperation = new NFTMintOperation(
        0,
        payload,
        outputOwners
      )
      expect(() => {
        nftMintOperation.setCodecID(2)
      }).toThrow(
        "Error - NFTMintOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    })
  })

  describe("NFTTransferOperation", (): void => {
    test("SelectOperationClass", (): void => {
      const nout: NFTTransferOutput = new NFTTransferOutput(
        1000,
        payload,
        addrs,
        locktime,
        1
      )
      const goodop: NFTTransferOperation = new NFTTransferOperation(nout)
      const operation: Operation = SelectOperationClass(goodop.getOperationID())
      expect(operation).toBeInstanceOf(NFTTransferOperation)
      expect((): void => {
        SelectOperationClass(99)
      }).toThrow("Error - SelectOperationClass: unknown opid")
    })

    test("comparator", (): void => {
      const op1: NFTTransferOperation = new NFTTransferOperation(
        new NFTTransferOutput(1000, payload, addrs, locktime, 1)
      )
      const op2: NFTTransferOperation = new NFTTransferOperation(
        new NFTTransferOutput(1001, payload, addrs, locktime, 1)
      )
      const op3: NFTTransferOperation = new NFTTransferOperation(
        new NFTTransferOutput(999, payload, addrs, locktime, 1)
      )
      const cmp = NFTTransferOperation.comparator()
      expect(cmp(op1, op1)).toBe(0)
      expect(cmp(op2, op2)).toBe(0)
      expect(cmp(op3, op3)).toBe(0)
      expect(cmp(op1, op2)).toBe(-1)
      expect(cmp(op1, op3)).toBe(1)
    })

    test("Functionality", (): void => {
      const nout: NFTTransferOutput = new NFTTransferOutput(
        1000,
        payload,
        addrs,
        locktime,
        1
      )
      const op: NFTTransferOperation = new NFTTransferOperation(nout)

      expect(op.getOperationID()).toBe(AVMConstants.NFTXFEROPID)
      expect(op.getOutput().toString()).toBe(nout.toString())

      const opcopy: NFTTransferOperation = new NFTTransferOperation()
      opcopy.fromBuffer(op.toBuffer())
      expect(opcopy.toString()).toBe(op.toString())

      op.addSignatureIdx(0, addrs[0])
      const sigidx: SigIdx[] = op.getSigIdxs()
      expect(sigidx[0].getSource().toString("hex")).toBe(
        addrs[0].toString("hex")
      )
      opcopy.fromBuffer(op.toBuffer())
      expect(opcopy.toString()).toBe(op.toString())
    })

    test("NFTTransferOperation codecIDs", (): void => {
      const nftTransferOperation: NFTTransferOperation =
        new NFTTransferOperation(
          new NFTTransferOutput(1000, payload, addrs, locktime, 1)
        )
      expect(nftTransferOperation.getCodecID()).toBe(codecID_zero)
      expect(nftTransferOperation.getOperationID()).toBe(
        AVMConstants.NFTXFEROPID
      )
      nftTransferOperation.setCodecID(codecID_one)
      expect(nftTransferOperation.getCodecID()).toBe(codecID_one)
      expect(nftTransferOperation.getOperationID()).toBe(
        AVMConstants.NFTXFEROPID_CODECONE
      )
      nftTransferOperation.setCodecID(codecID_zero)
      expect(nftTransferOperation.getCodecID()).toBe(codecID_zero)
      expect(nftTransferOperation.getOperationID()).toBe(
        AVMConstants.NFTXFEROPID
      )
    })

    test("Invalid NFTTransferOperation codecID", (): void => {
      const nftTransferOperation: NFTTransferOperation =
        new NFTTransferOperation(
          new NFTTransferOutput(1000, payload, addrs, locktime, 1)
        )
      expect((): void => {
        nftTransferOperation.setCodecID(2)
      }).toThrow(
        "Error - NFTTransferOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    })
  })

  test("TransferableOperation", (): void => {
    const nout: NFTTransferOutput = new NFTTransferOutput(
      1000,
      payload,
      addrs,
      locktime,
      1
    )
    const op: NFTTransferOperation = new NFTTransferOperation(nout)
    const nfttxid: Buffer = Buffer.from(
      createHash("sha256")
        .update(bintools.fromBNToBuffer(new BN(1000), 32))
        .digest()
    )
    const nftoutputidx: Buffer = Buffer.from(
      bintools.fromBNToBuffer(new BN(1000), 4)
    )
    const nftutxo: UTXO = new UTXO(
      AVMConstants.LATESTCODEC,
      nfttxid,
      nftoutputidx,
      assetIDBuff,
      nout
    )
    const xferop: TransferableOperation = new TransferableOperation(
      assetIDBuff,
      [nftutxo.getUTXOID()],
      op
    )

    const xferop2: TransferableOperation = new TransferableOperation(
      assetIDBuff,
      [Buffer.concat([nfttxid, nftoutputidx])],
      op
    )
    const uid: UTXOID = new UTXOID()
    uid.fromString(nftutxo.getUTXOID())
    const xferop3: TransferableOperation = new TransferableOperation(
      assetIDBuff,
      [uid],
      op
    )

    expect(xferop.getAssetID().toString("hex")).toBe(assetID)
    const utxoiddeserialized: Buffer = bintools.cb58Decode(
      xferop.getUTXOIDs()[0].toString()
    )
    expect(bintools.bufferToB58(utxoiddeserialized)).toBe(nftutxo.getUTXOID())
    expect(xferop.getOperation().toString()).toBe(op.toString())

    const opcopy: TransferableOperation = new TransferableOperation()
    opcopy.fromBuffer(xferop.toBuffer())
    expect(opcopy.toString()).toBe(xferop.toString())

    expect(xferop2.toBuffer().toString("hex")).toBe(
      xferop.toBuffer().toString("hex")
    )
    expect(xferop3.toBuffer().toString("hex")).toBe(
      xferop.toBuffer().toString("hex")
    )
  })
})
