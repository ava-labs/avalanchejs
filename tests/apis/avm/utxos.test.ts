import BN from "bn.js"
import { Buffer } from "buffer/"
import BinTools from "../../../src/utils/bintools"
import { UTXO, UTXOSet } from "../../../src/apis/avm/utxos"
import { AmountOutput } from "../../../src/apis/avm/outputs"
import { UnixNow } from "../../../src/utils/helperfunctions"
import { SerializedEncoding } from "../../../src/utils"

const bintools: BinTools = BinTools.getInstance()
const display: SerializedEncoding = "display"

describe("UTXO", (): void => {
  const utxohex: string =
    "000038d1b9f1138672da6fb6c35125539276a9acc2a668d63bea6ba3c795e2edb0f5000000013e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd3558000000070000000000004dd500000000000000000000000100000001a36fd0c2dbcab311731dde7ef1514bd26fcdc74d"
  const outputidx: string = "00000001"
  const outtxid: string =
    "38d1b9f1138672da6fb6c35125539276a9acc2a668d63bea6ba3c795e2edb0f5"
  const outaid: string =
    "3e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd3558"
  const utxobuff: Buffer = Buffer.from(utxohex, "hex")

  // Payment
  const OPUTXOstr: string = bintools.cb58Encode(utxobuff)
  // "U9rFgK5jjdXmV8k5tpqeXkimzrN3o9eCCcXesyhMBBZu9MQJCDTDo5Wn5psKvzJVMJpiMbdkfDXkp7sKZddfCZdxpuDmyNy7VFka19zMW4jcz6DRQvNfA2kvJYKk96zc7uizgp3i2FYWrB8mr1sPJ8oP9Th64GQ5yHd8"

  // implies fromString and fromBuffer
  test("Creation", (): void => {
    const u1: UTXO = new UTXO()
    u1.fromBuffer(utxobuff)
    const u1hex: string = u1.toBuffer().toString("hex")
    expect(u1hex).toBe(utxohex)
  })

  test("Empty Creation", (): void => {
    const u1: UTXO = new UTXO()
    expect((): void => {
      u1.toBuffer()
    }).toThrow()
  })

  test("Creation of Type", (): void => {
    const op: UTXO = new UTXO()
    op.fromString(OPUTXOstr)
    expect(op.getOutput().getOutputID()).toBe(7)
  })

  describe("Funtionality", (): void => {
    const u1: UTXO = new UTXO()
    u1.fromBuffer(utxobuff)
    test("getAssetID NonCA", (): void => {
      const assetID: Buffer = u1.getAssetID()
      expect(assetID.toString("hex", 0, assetID.length)).toBe(outaid)
    })
    test("getTxID", (): void => {
      const txid: Buffer = u1.getTxID()
      expect(txid.toString("hex", 0, txid.length)).toBe(outtxid)
    })
    test("getOutputIdx", (): void => {
      const txidx: Buffer = u1.getOutputIdx()
      expect(txidx.toString("hex", 0, txidx.length)).toBe(outputidx)
    })
    test("getUTXOID", (): void => {
      const txid: Buffer = Buffer.from(outtxid, "hex")
      const txidx: Buffer = Buffer.from(outputidx, "hex")
      const utxoid: string = bintools.bufferToB58(Buffer.concat([txid, txidx]))
      expect(u1.getUTXOID()).toBe(utxoid)
    })
    test("toString", (): void => {
      const serialized: string = u1.toString()
      expect(serialized).toBe(bintools.cb58Encode(utxobuff))
    })
  })
})

const setMergeTester = (
  input: UTXOSet,
  equal: UTXOSet[],
  notEqual: UTXOSet[]
): boolean => {
  const instr: string = JSON.stringify(input.getUTXOIDs().sort())
  for (let i: number = 0; i < equal.length; i++) {
    if (JSON.stringify(equal[i].getUTXOIDs().sort()) != instr) {
      return false
    }
  }

  for (let i: number = 0; i < notEqual.length; i++) {
    if (JSON.stringify(notEqual[i].getUTXOIDs().sort()) == instr) {
      return false
    }
  }
  return true
}

describe("UTXOSet", (): void => {
  const utxostrs: string[] = [
    bintools.cb58Encode(
      Buffer.from(
        "000038d1b9f1138672da6fb6c35125539276a9acc2a668d63bea6ba3c795e2edb0f5000000013e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd3558000000070000000000004dd500000000000000000000000100000001a36fd0c2dbcab311731dde7ef1514bd26fcdc74d",
        "hex"
      )
    ),
    bintools.cb58Encode(
      Buffer.from(
        "0000c3e4823571587fe2bdfc502689f5a8238b9d0ea7f3277124d16af9de0d2d9911000000003e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd355800000007000000000000001900000000000000000000000100000001e1b6b6a4bad94d2e3f20730379b9bcd6f176318e",
        "hex"
      )
    ),
    bintools.cb58Encode(
      Buffer.from(
        "0000f29dba61fda8d57a911e7f8810f935bde810d3f8d495404685bdb8d9d8545e86000000003e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd355800000007000000000000001900000000000000000000000100000001e1b6b6a4bad94d2e3f20730379b9bcd6f176318e",
        "hex"
      )
    )
  ]
  const addrs: Buffer[] = [
    bintools.cb58Decode("FuB6Lw2D62NuM8zpGLA4Avepq7eGsZRiG"),
    bintools.cb58Decode("MaTvKGccbYzCxzBkJpb2zHW7E1WReZqB8")
  ]
  test("Creation", (): void => {
    const set: UTXOSet = new UTXOSet()
    set.add(utxostrs[0])
    const utxo: UTXO = new UTXO()
    utxo.fromString(utxostrs[0])
    const setArray: UTXO[] = set.getAllUTXOs()
    expect(utxo.toString()).toBe(setArray[0].toString())
  })

  test("bad creation", (): void => {
    const set: UTXOSet = new UTXOSet()
    const bad: string = bintools.cb58Encode(Buffer.from("aasdfasd", "hex"))
    set.add(bad)
    const utxo: UTXO = new UTXO()

    expect((): void => {
      utxo.fromString(bad)
    }).toThrow()
  })

  test("Mutliple add", (): void => {
    const set: UTXOSet = new UTXOSet()
    // first add
    for (let i: number = 0; i < utxostrs.length; i++) {
      set.add(utxostrs[i])
    }
    // the verify (do these steps separate to ensure no overwrites)
    for (let i: number = 0; i < utxostrs.length; i++) {
      expect(set.includes(utxostrs[i])).toBe(true)
      const utxo: UTXO = new UTXO()
      utxo.fromString(utxostrs[i])
      const veriutxo: UTXO = set.getUTXO(utxo.getUTXOID()) as UTXO
      expect(veriutxo.toString()).toBe(utxostrs[i])
    }
  })

  test("addArray", (): void => {
    const set: UTXOSet = new UTXOSet()
    set.addArray(utxostrs)
    for (let i: number = 0; i < utxostrs.length; i++) {
      const e1: UTXO = new UTXO()
      e1.fromString(utxostrs[i])
      expect(set.includes(e1)).toBe(true)
      const utxo: UTXO = new UTXO()
      utxo.fromString(utxostrs[i])
      const veriutxo: UTXO = set.getUTXO(utxo.getUTXOID()) as UTXO
      expect(veriutxo.toString()).toBe(utxostrs[i])
    }

    set.addArray(set.getAllUTXOs())
    for (let i: number = 0; i < utxostrs.length; i++) {
      const utxo: UTXO = new UTXO()
      utxo.fromString(utxostrs[i])
      expect(set.includes(utxo)).toBe(true)

      const veriutxo: UTXO = set.getUTXO(utxo.getUTXOID()) as UTXO
      expect(veriutxo.toString()).toBe(utxostrs[i])
    }

    let o: object = set.serialize("hex")
    let s: UTXOSet = new UTXOSet()
    s.deserialize(o)
    let t: object = set.serialize(display)
    let r: UTXOSet = new UTXOSet()
    r.deserialize(t)
  })

  test("overwriting UTXO", (): void => {
    const set: UTXOSet = new UTXOSet()
    set.addArray(utxostrs)
    const testutxo: UTXO = new UTXO()
    testutxo.fromString(utxostrs[0])
    expect(set.add(utxostrs[0], true).toString()).toBe(testutxo.toString())
    expect(set.add(utxostrs[0], false)).toBeUndefined()
    expect(set.addArray(utxostrs, true).length).toBe(3)
    expect(set.addArray(utxostrs, false).length).toBe(0)
  })

  describe("Functionality", (): void => {
    let set: UTXOSet
    let utxos: UTXO[]
    beforeEach((): void => {
      set = new UTXOSet()
      set.addArray(utxostrs)
      utxos = set.getAllUTXOs()
    })

    test("remove", (): void => {
      const testutxo: UTXO = new UTXO()
      testutxo.fromString(utxostrs[0])
      expect(set.remove(utxostrs[0]).toString()).toBe(testutxo.toString())
      expect(set.remove(utxostrs[0])).toBeUndefined()
      expect(set.add(utxostrs[0], false).toString()).toBe(testutxo.toString())
      expect(set.remove(utxostrs[0]).toString()).toBe(testutxo.toString())
    })

    test("removeArray", (): void => {
      const testutxo: UTXO = new UTXO()
      testutxo.fromString(utxostrs[0])
      expect(set.removeArray(utxostrs).length).toBe(3)
      expect(set.removeArray(utxostrs).length).toBe(0)
      expect(set.add(utxostrs[0], false).toString()).toBe(testutxo.toString())
      expect(set.removeArray(utxostrs).length).toBe(1)
      expect(set.addArray(utxostrs, false).length).toBe(3)
      expect(set.removeArray(utxos).length).toBe(3)
    })

    test("getUTXOIDs", (): void => {
      const uids: string[] = set.getUTXOIDs()
      for (let i: number = 0; i < utxos.length; i++) {
        expect(uids.indexOf(utxos[i].getUTXOID())).not.toBe(-1)
      }
    })

    test("getAllUTXOs", (): void => {
      const allutxos: UTXO[] = set.getAllUTXOs()
      const ustrs: string[] = []
      for (let i: number = 0; i < allutxos.length; i++) {
        ustrs.push(allutxos[i].toString())
      }
      for (let i: number = 0; i < utxostrs.length; i++) {
        expect(ustrs.indexOf(utxostrs[i])).not.toBe(-1)
      }
      const uids: string[] = set.getUTXOIDs()
      const allutxos2: UTXO[] = set.getAllUTXOs(uids)
      const ustrs2: string[] = []
      for (let i: number = 0; i < allutxos.length; i++) {
        ustrs2.push(allutxos2[i].toString())
      }
      for (let i: number = 0; i < utxostrs.length; i++) {
        expect(ustrs2.indexOf(utxostrs[i])).not.toBe(-1)
      }
    })

    test("getUTXOIDs By Address", (): void => {
      let utxoids: string[]
      utxoids = set.getUTXOIDs([addrs[0]])
      expect(utxoids.length).toBe(1)
      utxoids = set.getUTXOIDs(addrs)
      expect(utxoids.length).toBe(3)
      utxoids = set.getUTXOIDs(addrs, false)
      expect(utxoids.length).toBe(3)
    })

    test("getAllUTXOStrings", (): void => {
      const ustrs: string[] = set.getAllUTXOStrings()
      for (let i: number = 0; i < utxostrs.length; i++) {
        expect(ustrs.indexOf(utxostrs[i])).not.toBe(-1)
      }
      const uids: string[] = set.getUTXOIDs()
      const ustrs2: string[] = set.getAllUTXOStrings(uids)
      for (let i: number = 0; i < utxostrs.length; i++) {
        expect(ustrs2.indexOf(utxostrs[i])).not.toBe(-1)
      }
    })

    test("getAddresses", (): void => {
      expect(set.getAddresses().sort()).toStrictEqual(addrs.sort())
    })

    test("getBalance", (): void => {
      let balance1: BN
      let balance2: BN
      balance1 = new BN(0)
      balance2 = new BN(0)
      for (let i: number = 0; i < utxos.length; i++) {
        const assetID = utxos[i].getAssetID()
        balance1.add(set.getBalance(addrs, assetID))
        balance2.add((utxos[i].getOutput() as AmountOutput).getAmount())
      }
      expect(balance1.toString()).toBe(balance2.toString())

      balance1 = new BN(0)
      balance2 = new BN(0)
      const now: BN = UnixNow()
      for (let i: number = 0; i < utxos.length; i++) {
        const assetID = bintools.cb58Encode(utxos[i].getAssetID())
        balance1.add(set.getBalance(addrs, assetID, now))
        balance2.add((utxos[i].getOutput() as AmountOutput).getAmount())
      }
      expect(balance1.toString()).toBe(balance2.toString())
    })

    test("getAssetIDs", (): void => {
      const assetIDs: Buffer[] = set.getAssetIDs()
      for (let i: number = 0; i < utxos.length; i++) {
        expect(assetIDs).toContain(utxos[i].getAssetID())
      }
      const addresses: Buffer[] = set.getAddresses()
      expect(set.getAssetIDs(addresses)).toEqual(set.getAssetIDs())
    })

    describe("Merge Rules", (): void => {
      let setA: UTXOSet
      let setB: UTXOSet
      let setC: UTXOSet
      let setD: UTXOSet
      let setE: UTXOSet
      let setF: UTXOSet
      let setG: UTXOSet
      let setH: UTXOSet
      // Take-or-Leave
      const newutxo: string = bintools.cb58Encode(
        Buffer.from(
          "0000acf88647b3fbaa9fdf4378f3a0df6a5d15d8efb018ad78f12690390e79e1687600000003acf88647b3fbaa9fdf4378f3a0df6a5d15d8efb018ad78f12690390e79e168760000000700000000000186a000000000000000000000000100000001fceda8f90fcb5d30614b99d79fc4baa293077626",
          "hex"
        )
      )

      beforeEach((): void => {
        setA = new UTXOSet()
        setA.addArray([utxostrs[0], utxostrs[2]])

        setB = new UTXOSet()
        setB.addArray([utxostrs[1], utxostrs[2]])

        setC = new UTXOSet()
        setC.addArray([utxostrs[0], utxostrs[1]])

        setD = new UTXOSet()
        setD.addArray([utxostrs[1]])

        setE = new UTXOSet()
        setE.addArray([]) // empty set

        setF = new UTXOSet()
        setF.addArray(utxostrs) // full set, separate from self

        setG = new UTXOSet()
        setG.addArray([newutxo, ...utxostrs]) // full set with new element

        setH = new UTXOSet()
        setH.addArray([newutxo]) // set with only a new element
      })

      test("unknown merge rule", (): void => {
        expect((): void => {
          set.mergeByRule(setA, "ERROR")
        }).toThrow()
      })

      test("intersection", (): void => {
        let results: UTXOSet
        let test: boolean

        results = set.mergeByRule(setA, "intersection")
        test = setMergeTester(
          results,
          [setA],
          [setB, setC, setD, setE, setF, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setF, "intersection")
        test = setMergeTester(
          results,
          [setF],
          [setA, setB, setC, setD, setE, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setG, "intersection")
        test = setMergeTester(
          results,
          [setF],
          [setA, setB, setC, setD, setE, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setH, "intersection")
        test = setMergeTester(
          results,
          [setE],
          [setA, setB, setC, setD, setF, setG, setH]
        )
        expect(test).toBe(true)
      })

      test("differenceSelf", (): void => {
        let results: UTXOSet
        let test: boolean

        results = set.mergeByRule(setA, "differenceSelf")
        test = setMergeTester(
          results,
          [setD],
          [setA, setB, setC, setE, setF, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setF, "differenceSelf")
        test = setMergeTester(
          results,
          [setE],
          [setA, setB, setC, setD, setF, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setG, "differenceSelf")
        test = setMergeTester(
          results,
          [setE],
          [setA, setB, setC, setD, setF, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setH, "differenceSelf")
        test = setMergeTester(
          results,
          [setF],
          [setA, setB, setC, setD, setE, setG, setH]
        )
        expect(test).toBe(true)
      })

      test("differenceNew", (): void => {
        let results: UTXOSet
        let test: boolean

        results = set.mergeByRule(setA, "differenceNew")
        test = setMergeTester(
          results,
          [setE],
          [setA, setB, setC, setD, setF, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setF, "differenceNew")
        test = setMergeTester(
          results,
          [setE],
          [setA, setB, setC, setD, setF, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setG, "differenceNew")
        test = setMergeTester(
          results,
          [setH],
          [setA, setB, setC, setD, setE, setF, setG]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setH, "differenceNew")
        test = setMergeTester(
          results,
          [setH],
          [setA, setB, setC, setD, setE, setF, setG]
        )
        expect(test).toBe(true)
      })

      test("symDifference", (): void => {
        let results: UTXOSet
        let test: boolean

        results = set.mergeByRule(setA, "symDifference")
        test = setMergeTester(
          results,
          [setD],
          [setA, setB, setC, setE, setF, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setF, "symDifference")
        test = setMergeTester(
          results,
          [setE],
          [setA, setB, setC, setD, setF, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setG, "symDifference")
        test = setMergeTester(
          results,
          [setH],
          [setA, setB, setC, setD, setE, setF, setG]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setH, "symDifference")
        test = setMergeTester(
          results,
          [setG],
          [setA, setB, setC, setD, setE, setF, setH]
        )
        expect(test).toBe(true)
      })

      test("union", (): void => {
        let results: UTXOSet
        let test: boolean

        results = set.mergeByRule(setA, "union")
        test = setMergeTester(
          results,
          [setF],
          [setA, setB, setC, setD, setE, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setF, "union")
        test = setMergeTester(
          results,
          [setF],
          [setA, setB, setC, setD, setE, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setG, "union")
        test = setMergeTester(
          results,
          [setG],
          [setA, setB, setC, setD, setE, setF, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setH, "union")
        test = setMergeTester(
          results,
          [setG],
          [setA, setB, setC, setD, setE, setF, setH]
        )
        expect(test).toBe(true)
      })

      test("unionMinusNew", (): void => {
        let results: UTXOSet
        let test: boolean

        results = set.mergeByRule(setA, "unionMinusNew")
        test = setMergeTester(
          results,
          [setD],
          [setA, setB, setC, setE, setF, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setF, "unionMinusNew")
        test = setMergeTester(
          results,
          [setE],
          [setA, setB, setC, setD, setF, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setG, "unionMinusNew")
        test = setMergeTester(
          results,
          [setE],
          [setA, setB, setC, setD, setF, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setH, "unionMinusNew")
        test = setMergeTester(
          results,
          [setF],
          [setA, setB, setC, setD, setE, setG, setH]
        )
        expect(test).toBe(true)
      })

      test("unionMinusSelf", (): void => {
        let results: UTXOSet
        let test: boolean

        results = set.mergeByRule(setA, "unionMinusSelf")
        test = setMergeTester(
          results,
          [setE],
          [setA, setB, setC, setD, setF, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setF, "unionMinusSelf")
        test = setMergeTester(
          results,
          [setE],
          [setA, setB, setC, setD, setF, setG, setH]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setG, "unionMinusSelf")
        test = setMergeTester(
          results,
          [setH],
          [setA, setB, setC, setD, setE, setF, setG]
        )
        expect(test).toBe(true)

        results = set.mergeByRule(setH, "unionMinusSelf")
        test = setMergeTester(
          results,
          [setH],
          [setA, setB, setC, setD, setE, setF, setG]
        )
        expect(test).toBe(true)
      })
    })
  })
})
