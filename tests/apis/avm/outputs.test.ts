import BN from "bn.js"
import { Buffer } from "buffer/"
import BinTools from "../../../src/utils/bintools"
import {
  SECPTransferOutput,
  SelectOutputClass,
  NFTMintOutput
} from "../../../src/apis/avm/outputs"
import { Output } from "../../../src/common/output"
import { SECPMintOutput } from "../../../src/apis/avm/outputs"
import { AVMConstants } from "../../../src/apis/avm"

const bintools: BinTools = BinTools.getInstance()

describe("Outputs", (): void => {
  const codecID_zero: number = 0
  const codecID_one: number = 1
  describe("NFTMintOutput", (): void => {
    const addrs: Buffer[] = [
      bintools.cb58Decode("B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW"),
      bintools.cb58Decode("P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF"),
      bintools.cb58Decode("6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV")
    ].sort()

    const locktime: BN = new BN(54321)
    const addrpay = [addrs[0], addrs[1]]
    const fallLocktime: BN = locktime.add(new BN(50))

    test("SelectOutputClass", (): void => {
      const goodout: NFTMintOutput = new NFTMintOutput(
        0,
        addrpay,
        fallLocktime,
        1
      )
      const outpayment: Output = SelectOutputClass(goodout.getOutputID())
      expect(outpayment).toBeInstanceOf(NFTMintOutput)
      expect((): void => {
        SelectOutputClass(99)
      }).toThrow("Error - SelectOutputClass: unknown outputid")
    })

    test("comparator", (): void => {
      const outpayment1: Output = new NFTMintOutput(1, addrs, fallLocktime, 1)
      const outpayment2: Output = new NFTMintOutput(2, addrs, fallLocktime, 1)
      const outpayment3: Output = new NFTMintOutput(0, addrs, fallLocktime, 1)
      const cmp = Output.comparator()
      expect(cmp(outpayment1, outpayment1)).toBe(0)
      expect(cmp(outpayment2, outpayment2)).toBe(0)
      expect(cmp(outpayment3, outpayment3)).toBe(0)
      expect(cmp(outpayment1, outpayment2)).toBe(-1)
      expect(cmp(outpayment1, outpayment3)).toBe(1)
    })

    test("NFTMintOutput codecIDs", (): void => {
      const nftMintOutput: NFTMintOutput = new NFTMintOutput(
        1,
        addrs,
        fallLocktime,
        1
      )

      expect(nftMintOutput.getCodecID()).toBe(codecID_zero)
      expect(nftMintOutput.getOutputID()).toBe(AVMConstants.NFTMINTOUTPUTID)
      nftMintOutput.setCodecID(codecID_one)
      expect(nftMintOutput.getCodecID()).toBe(codecID_one)
      expect(nftMintOutput.getOutputID()).toBe(
        AVMConstants.NFTMINTOUTPUTID_CODECONE
      )
      nftMintOutput.setCodecID(codecID_zero)
      expect(nftMintOutput.getCodecID()).toBe(codecID_zero)
      expect(nftMintOutput.getOutputID()).toBe(AVMConstants.NFTMINTOUTPUTID)
    })

    test("Invalid NFTMintOutput codecID", (): void => {
      const nftMintOutput: NFTMintOutput = new NFTMintOutput(
        1,
        addrs,
        fallLocktime,
        1
      )
      expect((): void => {
        nftMintOutput.setCodecID(2)
      }).toThrow(
        "Error - NFTMintOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    })

    test("Functionality", (): void => {
      const out: NFTMintOutput = new NFTMintOutput(0, addrs, fallLocktime, 3)
      expect(out.getOutputID()).toBe(10)
      expect(JSON.stringify(out.getAddresses().sort())).toStrictEqual(
        JSON.stringify(addrs.sort())
      )

      expect(out.getThreshold()).toBe(3)
      // expect(out.getLocktime().toNumber()).toBe(locktime.toNumber())

      const r = out.getAddressIdx(addrs[2])
      expect(out.getAddress(r)).toStrictEqual(addrs[2])
      expect((): void => {
        out.getAddress(400)
      }).toThrow()

      const b: Buffer = out.toBuffer()
      expect(out.toString()).toBe(bintools.bufferToB58(b))

      const s: Buffer[] = out.getSpenders(addrs)
      expect(JSON.stringify(s.sort())).toBe(JSON.stringify(addrs.sort()))

      const m1: boolean = out.meetsThreshold([addrs[0]])
      expect(m1).toBe(false)
      const m2: boolean = out.meetsThreshold(addrs, new BN(100))
      expect(m2).toBe(false)
      const m3: boolean = out.meetsThreshold(addrs)
      expect(m3).toBe(true)
      const m4: boolean = out.meetsThreshold(addrs, locktime.add(new BN(100)))
      expect(m4).toBe(true)
    })
  })

  describe("SECPTransferOutput", (): void => {
    const addrs: Buffer[] = [
      bintools.cb58Decode("B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW"),
      bintools.cb58Decode("P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF"),
      bintools.cb58Decode("6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV")
    ].sort()

    const locktime: BN = new BN(54321)
    const addrpay: Buffer[] = [addrs[0], addrs[1]]
    const fallLocktime: BN = locktime.add(new BN(50))

    test("SelectOutputClass", (): void => {
      const goodout: SECPTransferOutput = new SECPTransferOutput(
        new BN(2600),
        addrpay,
        fallLocktime,
        1
      )
      const outpayment: Output = SelectOutputClass(goodout.getOutputID())
      expect(outpayment).toBeInstanceOf(SECPTransferOutput)
      expect((): void => {
        SelectOutputClass(99)
      }).toThrow("Error - SelectOutputClass: unknown outputid")
    })

    test("comparator", (): void => {
      const outpayment1: Output = new SECPTransferOutput(
        new BN(10000),
        addrs,
        locktime,
        3
      )
      const outpayment2: Output = new SECPTransferOutput(
        new BN(10001),
        addrs,
        locktime,
        3
      )
      const outpayment3: Output = new SECPTransferOutput(
        new BN(9999),
        addrs,
        locktime,
        3
      )
      const cmp = Output.comparator()
      expect(cmp(outpayment1, outpayment1)).toBe(0)
      expect(cmp(outpayment2, outpayment2)).toBe(0)
      expect(cmp(outpayment3, outpayment3)).toBe(0)
      expect(cmp(outpayment1, outpayment2)).toBe(-1)
      expect(cmp(outpayment1, outpayment3)).toBe(1)
    })

    test("SECPTransferOutput", (): void => {
      const out: SECPTransferOutput = new SECPTransferOutput(
        new BN(10000),
        addrs,
        locktime,
        3
      )
      expect(out.getOutputID()).toBe(7)
      expect(JSON.stringify(out.getAddresses().sort())).toStrictEqual(
        JSON.stringify(addrs.sort())
      )

      expect(out.getThreshold()).toBe(3)
      expect(out.getLocktime().toNumber()).toBe(locktime.toNumber())

      const r: number = out.getAddressIdx(addrs[2])
      expect(out.getAddress(r)).toStrictEqual(addrs[2])
      expect((): void => {
        out.getAddress(400)
      }).toThrow()

      expect(out.getAmount().toNumber()).toBe(10000)

      const b: Buffer = out.toBuffer()
      expect(out.toString()).toBe(bintools.bufferToB58(b))

      const s: Buffer[] = out.getSpenders(addrs)
      expect(JSON.stringify(s.sort())).toBe(JSON.stringify(addrs.sort()))

      const m1: boolean = out.meetsThreshold([addrs[0]])
      expect(m1).toBe(false)
      const m2: boolean = out.meetsThreshold(addrs, new BN(100))
      expect(m2).toBe(false)
      const m3: boolean = out.meetsThreshold(addrs)
      expect(m3).toBe(true)
      const m4: boolean = out.meetsThreshold(addrs, locktime.add(new BN(100)))
      expect(m4).toBe(true)
    })

    test("SECPTransferOutput codecIDs", (): void => {
      const secPTransferOutput: SECPTransferOutput = new SECPTransferOutput(
        new BN(10000),
        addrs,
        locktime,
        3
      )
      expect(secPTransferOutput.getCodecID()).toBe(codecID_zero)
      expect(secPTransferOutput.getOutputID()).toBe(
        AVMConstants.SECPXFEROUTPUTID
      )
      secPTransferOutput.setCodecID(codecID_one)
      expect(secPTransferOutput.getCodecID()).toBe(codecID_one)
      expect(secPTransferOutput.getOutputID()).toBe(
        AVMConstants.SECPXFEROUTPUTID_CODECONE
      )
      secPTransferOutput.setCodecID(codecID_zero)
      expect(secPTransferOutput.getCodecID()).toBe(codecID_zero)
      expect(secPTransferOutput.getOutputID()).toBe(
        AVMConstants.SECPXFEROUTPUTID
      )
    })

    test("Invalid SECPTransferOutput codecID", (): void => {
      const secPTransferOutput: SECPTransferOutput = new SECPTransferOutput(
        new BN(10000),
        addrs,
        locktime,
        3
      )
      expect((): void => {
        secPTransferOutput.setCodecID(2)
      }).toThrow(
        "Error - SECPTransferOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    })

    test("SECPMintOutput", (): void => {
      const out: SECPMintOutput = new SECPMintOutput(addrs, locktime, 3)
      expect(out.getOutputID()).toBe(6)
      expect(JSON.stringify(out.getAddresses().sort())).toStrictEqual(
        JSON.stringify(addrs.sort())
      )
      expect(out.getThreshold()).toBe(3)
      expect(out.getLocktime().toNumber()).toBe(locktime.toNumber())
      const r: number = out.getAddressIdx(addrs[2])
      expect(out.getAddress(r)).toStrictEqual(addrs[2])
      expect(() => {
        out.getAddress(400)
      }).toThrow()
      const b: Buffer = out.toBuffer()
      expect(out.toString()).toBe(bintools.bufferToB58(b))
      const s: Buffer[] = out.getSpenders(addrs)
      expect(JSON.stringify(s.sort())).toBe(JSON.stringify(addrs.sort()))
      const m1: boolean = out.meetsThreshold([addrs[0]])
      expect(m1).toBe(false)
      const m2: boolean = out.meetsThreshold(addrs, new BN(100))
      expect(m2).toBe(false)
      const m3: boolean = out.meetsThreshold(addrs)
      expect(m3).toBe(true)
      const m4: boolean = out.meetsThreshold(addrs, locktime.add(new BN(100)))
      expect(m4).toBe(true)
    })

    test("SECPMintOutput bad address", (): void => {
      const badAddress = Buffer.from("adfasdfsas", "hex")

      expect((): void => {
        new SECPMintOutput([badAddress], locktime, 3)
      }).toThrow(
        "Error - NBytes.fromBuffer: Error: Error - NBytes.fromBuffer: not enough space available in buffer."
      )
    })

    test("SECPMintOutput codecIDs", (): void => {
      const secpMintOutput: SECPMintOutput = new SECPMintOutput(
        addrs,
        locktime,
        3
      )
      expect(secpMintOutput.getCodecID()).toBe(codecID_zero)
      expect(secpMintOutput.getOutputID()).toBe(AVMConstants.SECPMINTOUTPUTID)
      secpMintOutput.setCodecID(codecID_one)
      expect(secpMintOutput.getCodecID()).toBe(codecID_one)
      expect(secpMintOutput.getOutputID()).toBe(
        AVMConstants.SECPMINTOUTPUTID_CODECONE
      )
      secpMintOutput.setCodecID(codecID_zero)
      expect(secpMintOutput.getCodecID()).toBe(codecID_zero)
      expect(secpMintOutput.getOutputID()).toBe(AVMConstants.SECPMINTOUTPUTID)
    })

    test("Invalid SECPMintOutput codecID", (): void => {
      const secpMintOutput: SECPMintOutput = new SECPMintOutput(
        addrs,
        locktime,
        3
      )
      expect(() => {
        secpMintOutput.setCodecID(2)
      }).toThrow(
        "Error - SECPMintOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    })
  })
})
