import BinTools from "src/utils/bintools"
import BN from "bn.js"
import { Buffer } from "buffer/"

const bintools: BinTools = BinTools.getInstance()

describe("BinTools", (): void => {
  const hexstr: string = "00112233445566778899aabbccddeeff"
  const hexstr2: string = "0001020304050607080909080706050403020100"
  const hexstr3: string = "0001020304050607080909080706050403020101"
  const hexbuffstr1: string = "000461736466" // = asdf
  const hexbuffstr2: string = "000761626364656667" // = abcdefg
  const hexbuffstr3: string = "00076f6b0066696e65" // = ok<null>fineokfine
  const b58str: string = "1UoWww8DGaVGLtea7zU7p"
  const b58str2: string = "1Bhh3pU9gLXZiJv73kmqZwHJ4F"
  const b58str3: string = "1Bhh3pU9gLXZiJv73kmqZwHJ4G"
  const buff: Buffer = Buffer.from(hexstr, "hex")
  const buff2: Buffer = Buffer.from(hexstr2, "hex")
  const buff3: Buffer = Buffer.from(hexstr3, "hex")
  const checksum: string = "323e6811"
  const serializedChecksum: string = "148vjpuxYXixb8DcbaWyeDE2fEG" // serialized hexstr + checksum
  const longSerializedChecksum: string =
    "111Bit5JNASbJyTLrd2kWkYRoc96swEWoWdmEhuGAFK3rCAyTnTzomuFwgx1SCUdUE71KbtXPnqj93KGr3CeftpPN37kVyqBaAQ5xaDjr7wVBTUYi9iV7kYJnHF61yovViJF74mJJy7WWQKeRMDRTiPuii5gsd11gtNahCCsKbm9seJtk2h1wAPZn9M1eL84CGVPnLUiLP" // serialized hexstr + checksum
  const checksummedHexStr =
    "0x00000009de31b4d8b22991d51aa6aa1fc733f23a851a8c9400000000000186a0000000005f041280000000005f9ca900000030390000000000000001fceda8f90fcb5d30614b99d79fc4baa29307762668f16eb0259a57c2d3b78c875c86ec2045792d4df2d926c40f829196e0bb97ee697af71f5b0a966dabff749634c8b729855e937715b0e44303fd1014daedc752006011b730"
  test("copyFrom conducts a true copy", (): void => {
    const buff: Buffer = Buffer.from(hexstr, "hex")
    const newbuff: Buffer = bintools.copyFrom(buff, 0, 10)
    expect(newbuff.length).toBe(10)
    expect(newbuff.readUInt8(0)).toBe(0)
    expect(newbuff.readUInt8(9)).toBe(153)
    // verify that the original buffer isn't touched by writes
    newbuff.writeUInt8(153, 4)
    expect(newbuff.readUInt8(4)).toBe(153)
    expect(buff.readUInt8(4)).toBe(68)
    // test with no end specified
    const newbuff2: Buffer = bintools.copyFrom(buff, 2)
    expect(newbuff2.length).toBe(14)
    expect(newbuff2.readUInt8(0)).toBe(34)
    expect(newbuff2.readUInt8(7)).toBe(153)
  })

  test("bufferToString", (): void => {
    const bres: string = bintools.bufferToString(
      Buffer.from(hexbuffstr1, "hex")
    )
    expect(bres).toBe(Buffer.from(hexbuffstr1.slice(4), "hex").toString("utf8"))
    // testing null character edge case
    const bres2: string = bintools.bufferToString(
      Buffer.from(hexbuffstr2, "hex")
    )
    expect(bres2).toBe(
      Buffer.from(hexbuffstr2.slice(4), "hex").toString("utf8")
    )
    // testing null character edge case
    const bres3: string = bintools.bufferToString(
      Buffer.from(hexbuffstr3, "hex")
    )
    expect(bres3).toBe(
      Buffer.from(hexbuffstr3.slice(4), "hex").toString("utf8")
    )
  })

  test("stringToBuffer", (): void => {
    const bres: Buffer = bintools.stringToBuffer("asdf")
    expect(bres.slice(2).toString()).toBe(
      Buffer.from(hexbuffstr1.slice(4), "hex").toString("utf8")
    )
    // testing null character edge case
    const bres2: Buffer = bintools.stringToBuffer("abcdefg")
    expect(bres2.slice(2).toString()).toBe(
      Buffer.from(hexbuffstr2.slice(4), "hex").toString("utf8")
    )
    // testing null character edge case
    const bres3: Buffer = bintools.stringToBuffer(
      Buffer.from(hexbuffstr3.slice(4), "hex").toString("utf8")
    )
    expect(bres3.slice(2).toString()).toBe(
      Buffer.from(hexbuffstr3.slice(4), "hex").toString("utf8")
    )
  })

  test("bufferToB58", (): void => {
    const b58res: string = bintools.bufferToB58(buff)
    expect(b58res).toBe(b58str)
    // testing null character edge case
    const b58res2: string = bintools.bufferToB58(buff2)
    expect(b58res2).toBe(b58str2)
    // testing null character edge case
    const b58res3: string = bintools.bufferToB58(buff3)
    expect(b58res3).toBe(b58str3)
  })

  test("b58ToBuffer", (): void => {
    expect((): void => {
      bintools.b58ToBuffer("0OO0O not a valid b58 string 0OO0O")
    }).toThrow("Error - Base58.decode: not a valid base58 string")

    const buffres: Buffer = bintools.b58ToBuffer(b58str)
    expect(buffres.toString()).toBe(buff.toString())
    // testing zeros character edge case
    const buffres2: Buffer = bintools.b58ToBuffer(b58str2)
    expect(buffres2.toString()).toBe(buff2.toString())
    // testing zeros character edge case
    const buffres3: Buffer = bintools.b58ToBuffer(b58str3)
    expect(buffres3.toString()).toBe(buff3.toString())
  })

  test("fromBufferToArrayBuffer", (): void => {
    const arrbuff: ArrayBuffer = bintools.fromBufferToArrayBuffer(buff)
    expect(arrbuff.byteLength).toBe(buff.length)
    for (let i: number = 0; i < buff.length; i++) {
      expect(arrbuff[i]).toBe(buff[i])
    }
    // verify that the original buffer isn't touched by writes
    arrbuff[2] = 55
    expect(buff[2]).not.toBe(55)
  })

  test("fromArrayBufferToBuffer", (): void => {
    const arrbuff: ArrayBuffer = new ArrayBuffer(10)
    for (let i: number = 0; i < 10; i++) {
      arrbuff[i] = i
    }
    const newbuff: Buffer = bintools.fromArrayBufferToBuffer(arrbuff)
    expect(newbuff.length).toBe(arrbuff.byteLength)
    for (let i: number = 0; i < newbuff.length; i++) {
      expect(newbuff[i]).toBe(arrbuff[i])
    }
    // verify that the original buffer isnt touched by writes
    newbuff[3] = 55
    expect(arrbuff[3]).not.toBe(newbuff[3])
  })

  test("fromBufferToBN", (): void => {
    const bign: BN = bintools.fromBufferToBN(buff)
    expect(bign.toString("hex", hexstr.length)).toBe(hexstr)
  })

  test("fromBNToBuffer", (): void => {
    const bn1: BN = new BN(hexstr, "hex", "be")
    const bn2: BN = new BN(hexstr, "hex", "be")
    const b1: Buffer = bintools.fromBNToBuffer(bn1)
    const b2: Buffer = bintools.fromBNToBuffer(bn2, buff.length)

    expect(b1.length).toBe(buff.length - 1)
    expect(b1.toString("hex")).toBe(hexstr.slice(2))

    expect(b2.length).toBe(buff.length)
    expect(b2.toString("hex")).toBe(hexstr)
  })

  test("addChecksum", (): void => {
    const buffchecked: Buffer = bintools.addChecksum(buff)
    expect(buffchecked.length).toBe(buff.length + 4)
    expect(buffchecked.slice(16).toString("hex")).toBe(checksum)
  })

  test("validteChecksum", (): void => {
    const checksummed: string = hexstr + checksum
    const badsummed: string = `${hexstr}324e7822`
    expect(bintools.validateChecksum(Buffer.from(checksummed, "hex"))).toBe(
      true
    )
    expect(bintools.validateChecksum(buff)).toBe(false)
    expect(bintools.validateChecksum(Buffer.from(badsummed, "hex"))).toBe(false)
  })

  test("cb58Encode", (): void => {
    const fromBuff: string = bintools.cb58Encode(buff)
    expect(fromBuff).toBe(serializedChecksum)
  })

  test("cb58Decode", (): void => {
    const serbuff: Buffer = bintools.b58ToBuffer(serializedChecksum)
    const dsr1: Buffer = bintools.cb58Decode(serializedChecksum)
    const dsr2: Buffer = bintools.cb58Decode(serbuff)
    const serbufffaulty: Buffer = bintools.copyFrom(serbuff)
    serbufffaulty[serbufffaulty.length - 1] =
      serbufffaulty[serbufffaulty.length - 1] - 1
    expect(dsr1.toString("hex")).toBe(hexstr)
    expect(dsr2.toString("hex")).toBe(hexstr)
    expect((): void => {
      bintools.cb58Decode(serbufffaulty)
    }).toThrow("Error - BinTools.cb58Decode: invalid checksum")
  })

  test("cb58DecodeWithChecksum", (): void => {
    const serbuff: Buffer = bintools.b58ToBuffer(longSerializedChecksum)
    const dsr1: string = bintools.cb58DecodeWithChecksum(longSerializedChecksum)
    const dsr2: string = bintools.cb58DecodeWithChecksum(serbuff)
    const serbufffaulty: Buffer = bintools.copyFrom(serbuff)
    serbufffaulty[serbufffaulty.length - 1] =
      serbufffaulty[serbufffaulty.length - 1] - 1
    expect(dsr1).toBe(checksummedHexStr)
    expect(dsr2).toBe(checksummedHexStr)
    expect((): void => {
      bintools.cb58Decode(serbufffaulty)
    }).toThrow("Error - BinTools.cb58Decode: invalid checksum")
  })

  test("isCB58", (): void => {
    const validCB581: string =
      "isGvtnDqETNmmFw7guSJ7mmWhCqboExrpmC8VsWxckHcH9oXb"
    const validCB582: string =
      "2PwX8qwMHbwVAm28howu3Ef7Lk4ib2XG7AaY9aK8dTTGNXQkCz"
    const invalidCB581: string =
      "ddd.tnDqETNmmFw7guSJ7mmWhCqboExrpmC8VsWxckHcHzzzz"
    const invalidCB582: string = ""
    expect(bintools.isCB58(validCB581)).toBe(true)
    expect(bintools.isCB58(validCB582)).toBe(true)
    expect(bintools.isCB58(invalidCB581)).toBe(false)
    expect(bintools.isCB58(invalidCB582)).toBe(false)
  })

  test("isBase58", (): void => {
    const validBase581: string =
      "isGvtnDqETNmmFw7guSJ7mmWhCqboExrpmC8VsWxckHcH9oXb"
    const validBase582: string =
      "2PwX8qwMHbwVAm28howu3Ef7Lk4ib2XG7AaY9aK8dTTGNXQkCz"
    const invalidBase581: string =
      "ddd.tnDqETNmmFw7guSJ7mmWhCqboExrpmC8VsWxckHcHzzzz"
    const invalidBase582: string = ""
    expect(bintools.isBase58(validBase581)).toBe(true)
    expect(bintools.isBase58(validBase582)).toBe(true)
    expect(bintools.isBase58(invalidBase581)).toBe(false)
    expect(bintools.isBase58(invalidBase582)).toBe(false)
  })

  test("isHex", (): void => {
    const validHex1: string =
      "0x95eaac2b7a6ee7ad7e597c2f5349b03e461c36c2e1e50fc98a84d01612940bd5"
    const validHex2: string =
      "95eaac2b7a6ee7ad7e597c2f5349b03e461c36c2e1e50fc98a84d01612940bd5"
    const invalidHex1: string =
      "rrrrr.c2b7a6ee7ad7e597c2f5349b03e461c36c2e1e5.fc98a84d016129zzzzz"
    const invalidHex2: string = ""
    expect(bintools.isHex(validHex1)).toBe(true)
    expect(bintools.isHex(validHex2)).toBe(true)
    expect(bintools.isHex(invalidHex1)).toBe(false)
    expect(bintools.isHex(invalidHex2)).toBe(false)
  })

  test("stringToAddress", (): void => {
    // Missing prefix
    let addr: string = "-avax13a4ye34zdfa33zeg3udnz533d6msfuqkds9hq7"
    expect((): void => {
      bintools.stringToAddress(addr)
    }).toThrow("Error - Valid address must have prefix before -")

    // Missing -
    addr = "Xavax13a4ye34zdfa33zeg3udnz533d6msfuqkds9hq7"
    expect((): void => {
      bintools.stringToAddress(addr)
    }).toThrow("Error - Valid address should include -")

    // Missing seperator (1)
    addr = "X-avax3a4ye34zdfa33zeg3udnz533d6msfuqkds9hq7"
    expect((): void => {
      bintools.stringToAddress(addr)
    }).toThrow("Error - Valid address must include separator (1)")

    // Missing HRP
    addr = "X-13a4ye34zdfa33zeg3udnz533d6msfuqkds9hq7"
    expect((): void => {
      bintools.stringToAddress(addr)
    }).toThrow("Error - HRP should be at least 1 character")

    // Invalid HRP
    addr = "X-avax11ycxp65vz60m87mkm2hsw3m5fadjlpldzntvr33"
    expect((): void => {
      bintools.stringToAddress(addr)
    }).toThrow("Error - Invalid HRP")

    // Extra character in data bytes
    addr = "X-local1dcfyuug87xqayl4fpp02z9dvknwhafdswtvnucd"
    expect((): void => {
      bintools.stringToAddress(addr)
    }).toThrow(
      "Invalid checksum for local1dcfyuug87xqayl4fpp02z9dvknwhafdswtvnucd"
    )

    // Change character in data bytes
    addr = "X-local1dcfyuug8fxqayl4fpp02z9dvknwhafdstvnucd"
    expect((): void => {
      bintools.stringToAddress(addr)
    }).toThrow(
      "Invalid checksum for local1dcfyuug8fxqayl4fpp02z9dvknwhafdstvnucd"
    )

    // Invalid character in data bytes
    addr = "X-local1dcfyuug87xqbyl4fpp02z9dvknwhafdstvnucd"
    expect((): void => {
      bintools.stringToAddress(addr)
    }).toThrow("Unknown character b")

    // Change character in checksum
    addr = "X-local1dcfyuug87xqayl4fpp02z9dvknwhafdstvnuce"
    expect((): void => {
      bintools.stringToAddress(addr)
    }).toThrow(
      "Invalid checksum for local1dcfyuug87xqayl4fpp02z9dvknwhafdstvnuce"
    )

    // Invalid ETH-style address
    addr = "0x.db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
    expect((): void => {
      bintools.stringToAddress(addr)
    }).toThrow("Error - Invalid address")

    let addrs: string[] = [
      "X-local1dcfyuug87xqayl4fpp02z9dvknwhafdstvnucd",
      "X-local1ltghj033re64920k786uprcp82p9e36j7hzc5x",
      "X-local1dq4q9seql2spxrkd7rl82uck5ej3nvlhrluh4u"
    ]
    addrs.forEach((address: string): void => {
      bintools.stringToAddress(address)
    })
    addrs = [
      "X-fuji1dcfyuug87xqayl4fpp02z9dvknwhafds7d29h6",
      "X-fuji1ltghj033re64920k786uprcp82p9e36jtkmpm3",
      "X-fuji1dq4q9seql2spxrkd7rl82uck5ej3nvlhk79w6t"
    ]
    addrs.forEach((address: string): void => {
      bintools.stringToAddress(address)
    })
    addrs = [
      "X-avax1dcfyuug87xqayl4fpp02z9dvknwhafdsjlw6m9",
      "X-avax1ltghj033re64920k786uprcp82p9e36j8yl7hw",
      "X-avax1dq4q9seql2spxrkd7rl82uck5ej3nvlh6vp3k5"
    ]
    addrs.forEach((address: string): void => {
      bintools.stringToAddress(address)
    })
    addrs = [
      "P-local1dcfyuug87xqayl4fpp02z9dvknwhafdstvnucd",
      "P-local1ltghj033re64920k786uprcp82p9e36j7hzc5x",
      "P-local1dq4q9seql2spxrkd7rl82uck5ej3nvlhrluh4u"
    ]
    addrs.forEach((address: string): void => {
      bintools.stringToAddress(address)
    })
    addrs = [
      "P-fuji1dcfyuug87xqayl4fpp02z9dvknwhafds7d29h6",
      "P-fuji1ltghj033re64920k786uprcp82p9e36jtkmpm3",
      "P-fuji1dq4q9seql2spxrkd7rl82uck5ej3nvlhk79w6t"
    ]
    addrs.forEach((address: string): void => {
      bintools.stringToAddress(address)
    })
    addrs = [
      "P-avax1dcfyuug87xqayl4fpp02z9dvknwhafdsjlw6m9",
      "P-avax1ltghj033re64920k786uprcp82p9e36j8yl7hw",
      "P-avax1dq4q9seql2spxrkd7rl82uck5ej3nvlh6vp3k5"
    ]
    addrs.forEach((address: string): void => {
      bintools.stringToAddress(address)
    })

    addrs = [
      "C-local1dcfyuug87xqayl4fpp02z9dvknwhafdstvnucd",
      "C-local1ltghj033re64920k786uprcp82p9e36j7hzc5x",
      "C-local1dq4q9seql2spxrkd7rl82uck5ej3nvlhrluh4u"
    ]
    addrs.forEach((address: string): void => {
      bintools.stringToAddress(address)
    })

    addrs = [
      "C-fuji1dcfyuug87xqayl4fpp02z9dvknwhafds7d29h6",
      "C-fuji1ltghj033re64920k786uprcp82p9e36jtkmpm3",
      "C-fuji1dq4q9seql2spxrkd7rl82uck5ej3nvlhk79w6t"
    ]
    addrs.forEach((address: string): void => {
      bintools.stringToAddress(address)
    })

    addrs = [
      "C-avax1dcfyuug87xqayl4fpp02z9dvknwhafdsjlw6m9",
      "C-avax1ltghj033re64920k786uprcp82p9e36j8yl7hw",
      "C-avax1dq4q9seql2spxrkd7rl82uck5ej3nvlh6vp3k5"
    ]
    addrs.forEach((address: string): void => {
      bintools.stringToAddress(address)
    })

    addrs = [
      "X-foo1dcfyuug87xqayl4fpp02z9dvknwhafds4k3km3",
      "X-foo1ltghj033re64920k786uprcp82p9e36jqdqjh6",
      "X-foo1dq4q9seql2spxrkd7rl82uck5ej3nvlha97akq"
    ]
    addrs.forEach((address: string): void => {
      bintools.stringToAddress(address, "foo")
    })

    addrs = [
      "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC",
      "0xC1ad78FDd4aEd027EbD5e9eee878f44dc1E29358",
      "0x5B44bC2622dc5DD66a94cd5f2aDc3a49abb864dE"
    ]
    addrs.forEach((address: string): void => {
      bintools.stringToAddress(address)
    })
  })
})
