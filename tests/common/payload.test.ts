import { Buffer } from "buffer/"
import {
  PayloadTypes,
  BINPayload,
  PayloadBase,
  UTF8Payload,
  HEXSTRPayload,
  B58STRPayload,
  B64STRPayload,
  BIGNUMPayload,
  XCHAINADDRPayload,
  PCHAINADDRPayload,
  CCHAINADDRPayload,
  TXIDPayload,
  JSONPayload,
  EMAILPayload
} from "../../src/utils/payload"
import BinTools from "../../src/utils/bintools"
import BN from "bn.js"
import * as bech32 from "bech32"
const payloadTypes: PayloadTypes = PayloadTypes.getInstance()
const bintools: BinTools = BinTools.getInstance()

describe("Payload", (): void => {
  const hrp: string = "tests"

  const cb58str: string = "MBcQpm1PsdfBKYscN3AYP56MusRDMZGF9"
  const cb58buf: string = bintools.bufferToB58(bintools.cb58Decode(cb58str))
  const bech: string = bech32.bech32.encode(
    hrp,
    bech32.bech32.toWords(bintools.b58ToBuffer(cb58buf))
  )
  const binstr: string = "Bx4v7ytutz3"
  const utf8str: string = "I am the very model of a modern Major-General."
  const utf8b58: string = bintools.bufferToB58(Buffer.from(utf8str))
  const utf8hex: string = Buffer.from(utf8str).toString("hex")
  const utf8b64: string = Buffer.from(utf8str).toString("base64")
  const bnhex: string = "deadbeef"
  const svgstr: string = "<svg>hi mom</svg>"
  const csvstr: string =
    "1,2,3,4,5\neverybody,in the,house,come along, let's ride"
  const jsonobj: object = { boom: "goes the dynamite" }
  const yamlstr: string =
    "---\nrootproperty: blah\nsection:\n  one: two\n  three: four\n  Foo: Bar\n  empty: ~"
  const emailstr: string = "example@example.com"
  const urlstr: string = "https://example.com"
  const ipfsstr: string = "QmUy4jh5mGNZvLkjies1RWM4YuvJh5o2FYopNPVYwrRVGV"
  const onionstr: string = "https://el33th4xor.onion"
  const magnetstr: string =
    "magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a"

  test("PayloadTypes", (): void => {
    expect((): void => {
      payloadTypes.select(867309)
    }).toThrow()

    expect(payloadTypes.lookupID("BIN")).toBe(0)

    const binpayload = payloadTypes.select(0, binstr) as BINPayload
    const utf8payload = payloadTypes.select(1, utf8str) as UTF8Payload
    const hexstrpayload = payloadTypes.select(2, bnhex) as HEXSTRPayload
    const emailpayload = payloadTypes.select(26, emailstr) as EMAILPayload

    expect(payloadTypes.getTypeID(binpayload.toBuffer())).toBe(0)
    expect(payloadTypes.getTypeID(utf8payload.toBuffer())).toBe(1)
    expect(payloadTypes.getTypeID(hexstrpayload.toBuffer())).toBe(2)
    expect(payloadTypes.getTypeID(emailpayload.toBuffer())).toBe(26)

    const pp: Buffer = payloadTypes.getContent(binpayload.toBuffer())

    expect(bintools.b58ToBuffer(binstr).toString("hex")).toBe(
      pp.toString("hex")
    )
    expect(payloadTypes.lookupType(0)).toBe("BIN")
    expect(payloadTypes.recast(binpayload).toBuffer().toString("hex")).toBe(
      binpayload.toBuffer().toString("hex")
    )
  })

  const testTable: any[] = [
    ["BIN", binstr, binstr],
    ["UTF8", utf8str, utf8b58],
    ["HEXSTR", utf8hex, utf8b58],
    ["B58STR", utf8b58, utf8b58],
    ["B64STR", utf8b64, utf8b58],
    ["BIGNUM", bnhex, bintools.bufferToB58(Buffer.from(bnhex, "hex"))],
    ["XCHAINADDR", "X-" + bech, cb58buf],
    ["PCHAINADDR", "P-" + bech, cb58buf],
    ["CCHAINADDR", "C-" + bech, cb58buf],
    ["TXID", cb58str, cb58buf],
    ["ASSETID", cb58str, cb58buf],
    ["UTXOID", cb58str, cb58buf],
    ["NFTID", cb58str, cb58buf],
    ["SUBNETID", cb58str, cb58buf],
    ["CHAINID", cb58str, cb58buf],
    ["NODEID", cb58str, cb58buf],
    ["SECPSIG", cb58str, cb58str],
    ["SECPENC", cb58str, cb58str],
    ["JPEG", binstr, binstr],
    ["PNG", binstr, binstr],
    ["BMP", binstr, binstr],
    ["ICO", binstr, binstr],
    ["SVG", svgstr, bintools.bufferToB58(Buffer.from(svgstr))],
    ["CSV", csvstr, bintools.bufferToB58(Buffer.from(csvstr))],
    [
      "JSON",
      JSON.stringify(jsonobj),
      bintools.bufferToB58(Buffer.from(JSON.stringify(jsonobj)))
    ],
    ["YAML", yamlstr, bintools.bufferToB58(Buffer.from(yamlstr))],
    ["EMAIL", emailstr, bintools.bufferToB58(Buffer.from(emailstr))],
    ["URL", urlstr, bintools.bufferToB58(Buffer.from(urlstr))],
    ["IPFS", ipfsstr, ipfsstr],
    ["ONION", onionstr, bintools.bufferToB58(Buffer.from(onionstr))],
    ["MAGNET", magnetstr, bintools.bufferToB58(Buffer.from(magnetstr))]
  ]
  test.each(testTable)(
    "Basic Payload Test: typestr %s input %s inputbuff %s",
    (typestr: string, inputstr: string, inputbuff: string): void => {
      const buff: Buffer = bintools.b58ToBuffer(inputbuff)
      const typeid: number = payloadTypes.lookupID(typestr)
      const typename: string = payloadTypes.lookupType(typeid)
      expect(typename).toBe(typestr)
      const c0: PayloadBase = payloadTypes.select(typeid)
      expect(c0.typeID()).toBe(typeid)
      expect(c0.typeName()).toBe(typename)
      const c1: PayloadBase = payloadTypes.select(typeid, buff)
      const c2: PayloadBase = payloadTypes.select(typeid, inputstr, hrp)
      const c3: PayloadBase = payloadTypes.select(typeid)
      c3.fromBuffer(c1.toBuffer())
      const c4: PayloadBase = payloadTypes.select(typeid)
      c4.fromBuffer(c2.toBuffer())

      const s1: string = c1.toBuffer().toString("hex")
      const s2: string = c2.toBuffer().toString("hex")
      const s3: string = c3.toBuffer().toString("hex")
      const s4: string = c4.toBuffer().toString("hex")

      expect(s1).toBe(s2)
      expect(s2).toBe(s3)
      expect(s3).toBe(s4)
    }
  )

  test("BINPayload special cases", (): void => {
    const pl: BINPayload = payloadTypes.select(0, binstr) as BINPayload
    expect(bintools.bufferToB58(pl.returnType())).toBe(binstr)
  })

  test("UTF8Payload special cases", (): void => {
    const pl: UTF8Payload = new UTF8Payload(utf8str)
    expect(pl.returnType()).toBe(utf8str)
  })

  test("HEXSTRPayload special cases", (): void => {
    const pl: HEXSTRPayload = new HEXSTRPayload(utf8hex)
    expect(pl.returnType()).toBe(utf8hex)
  })

  test("B58STRPayload special cases", (): void => {
    const pl: B58STRPayload = new B58STRPayload(utf8b58)
    expect(pl.returnType()).toBe(utf8b58)
  })

  test("B64STRPayload special cases", (): void => {
    const pl: B64STRPayload = new B64STRPayload(utf8b64)
    expect(pl.returnType()).toBe(utf8b64)
  })

  test("BIGNUMPayload special cases", (): void => {
    const jenny: BN = new BN(8675309)
    const pl: BIGNUMPayload = new BIGNUMPayload(jenny)
    expect(pl.returnType().toString("hex")).toBe(jenny.toString("hex"))
  })

  test("XCHAINADDRPayload special cases", (): void => {
    const addr: string = `X-${bech}`
    const pl: XCHAINADDRPayload = new XCHAINADDRPayload(addr, hrp)
    expect(pl.returnType(hrp)).toBe(addr)
    expect(pl.returnChainID()).toBe("X")
  })

  test("PCHAINADDRPayload special cases", (): void => {
    const addr: string = `P-${bech}`
    const pl: PCHAINADDRPayload = new PCHAINADDRPayload(addr, hrp)
    expect(pl.returnType(hrp)).toBe(addr)
    expect(pl.returnChainID()).toBe("P")
  })

  test("CCHAINADDRPayload special cases", (): void => {
    const addr: string = `C-${bech}`
    const pl: CCHAINADDRPayload = new CCHAINADDRPayload(addr, hrp)
    expect(pl.returnType(hrp)).toBe(addr)
    expect(pl.returnChainID()).toBe("C")
  })

  // handles all of cb58EncodedPayload
  test("TXIDPayload special cases", (): void => {
    const pl: TXIDPayload = new TXIDPayload(cb58str)
    expect(pl.returnType()).toBe(cb58str)
  })

  test("JSONPayload special cases", (): void => {
    const pl: JSONPayload = new JSONPayload(jsonobj)
    expect(JSON.stringify(pl.returnType())).toBe(JSON.stringify(jsonobj))
  })
})
