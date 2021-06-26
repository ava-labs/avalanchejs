import BN from 'bn.js'
import { Buffer } from 'buffer/'
import { Serialization, SerializedEncoding, SerializedType } from '../../src/utils'
import { getPreferredHRP } from '../../src/utils'

const serialization: Serialization = Serialization.getInstance()

describe("Serialization", (): void => {
  const address: string = "X-avax1wst8jt3z3fm9ce0z6akj3266zmgccdp03hjlaj"
  const nodeID: string = "NodeID-MFrZFVCXPv5iCn6M9K6XduxGTYp891xXZ"
  const privateKey: string = "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
  const cb58: string = "2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed"
  const base64: string = "ZnJvbSBzbm93Zmxha2UgdG8gQXZhbGFuY2hl"
  const hex: string = "66726f6d20736e6f77666c616b6520746f204176616c616e636865"
  const decimalString: string = "12345"
  const num: number = 12345
  const utf8: string = "from snowflake to Avalanche"
  const bn: BN = new BN(9000)
  const name: string = "BaseTx"
  const denomination: Buffer = Buffer.alloc(1)
  const chainID: string = "X"
  const hrp: any = getPreferredHRP(1)

  test("instance of", (): void => {
    expect(serialization).toBeInstanceOf(Serialization)
  })

  describe("typeToBuffer && bufferToType", (): void => {
    let t: SerializedType
    let buf: Buffer
    test("BN", (): void => {
      t = "BN"
      const bn: BN = new BN(9000)
      buf = serialization.typeToBuffer(bn, t)
      const b: BN = serialization.bufferToType(buf, t)
      expect(bn.toString()).toEqual(b.toString())
    })

    test("bech32", (): void => {
      t = "bech32"
      buf = serialization.typeToBuffer(address, t)
      const bech32: string = serialization.bufferToType(buf, t, hrp, chainID)
      expect(bech32).toEqual(address)
    })

    test("nodeID", (): void => {
      t = "nodeID"
      buf = serialization.typeToBuffer(nodeID, t)
      const n: string = serialization.bufferToType(buf, t)
      expect(nodeID).toEqual(n)
    })

    test("privateKey", (): void => {
      t = "privateKey"
      buf = serialization.typeToBuffer(privateKey, t)
      const p: string = serialization.bufferToType(buf, t)
      expect(privateKey).toEqual(p)
    })

    test("cb58", (): void => {
      t = "cb58"
      buf = serialization.typeToBuffer(cb58, t)
      const c: string = serialization.bufferToType(buf, t)
      expect(cb58).toEqual(c)
    })

    test("base58", (): void => {
      t = "cb58"
      buf = serialization.typeToBuffer(cb58, t)
      const c: string = serialization.bufferToType(buf, t)
      expect(cb58).toEqual(c)
    })

    test("base64", (): void => {
      t = "base64"
      buf = serialization.typeToBuffer(base64, t)
      const b64: string = serialization.bufferToType(buf, t)
      expect(base64).toEqual(b64)
    })

    test("hex", (): void => {
      t = "hex"
      buf = serialization.typeToBuffer(hex, t)
      const h: string = serialization.bufferToType(buf, t)
      expect(hex).toEqual(h)
    })

    test("decimalString", (): void => {
      t = "decimalString"
      buf = serialization.typeToBuffer(decimalString, t)
      const d: string = serialization.bufferToType(buf, t)
      expect(decimalString).toEqual(d)
    })

    test("number", (): void => {
      t = "number"
      buf = serialization.typeToBuffer(num, t)
      const nu: string = serialization.bufferToType(buf, t)
      expect(num).toEqual(nu)
    })

    test("utf8", (): void => {
      t = "utf8"
      buf = serialization.typeToBuffer(utf8, t)
      const u: string = serialization.bufferToType(buf, t)
      expect(utf8).toEqual(u)
    })
  })

  describe("encoder && decoder", (): void => {
    const encoding: SerializedEncoding = "hex"
    let t: SerializedType
    let buf: Buffer
    test("BN", (): void => {
      const str: string = serialization.encoder(bn, encoding, "BN", "BN")
      const decoded: string = serialization.decoder(str, encoding, "BN", "BN")
      expect(bn.toString()).toEqual(decoded.toString())
    })

    test("bech32", (): void => {
      const str: string = serialization.encoder(address, encoding, "bech32", "bech32")
      const decoded: string = serialization.decoder(str, encoding, "bech32", "bech32", hrp, chainID)
      expect(address).toEqual(decoded)
    })

    test("nodeID", (): void => {
      const str: string = serialization.encoder(nodeID, encoding, "nodeID", "nodeID")
      const decoded: string = serialization.decoder(str, encoding, "nodeID", "nodeID")
      expect(nodeID).toEqual(decoded)
    })

    test("privateKey", (): void => {
      const str: string = serialization.encoder(privateKey, encoding, "privateKey", "privateKey")
      const decoded: string = serialization.decoder(str, encoding, "privateKey", "privateKey")
      expect(privateKey).toEqual(decoded)
    })

    test("cb58", (): void => {
      const str: string = serialization.encoder(cb58, encoding, "cb58", "cb58")
      const decoded: string = serialization.decoder(str, encoding, "cb58", "cb58")
      expect(cb58).toEqual(decoded)
    })

    test("base58", (): void => {
      const str: string = serialization.encoder(cb58, encoding, "base58", "base58")
      const decoded: string = serialization.decoder(str, encoding, "base58", "base58")
      expect(cb58).toEqual(decoded)
    })

    test("base64", (): void => {
      const str: string = serialization.encoder(base64, encoding, "base64", "base64")
      const decoded: string = serialization.decoder(str, encoding, "base64", "base64")
      expect(base64).toEqual(decoded)
    })

    test("hex", (): void => {
      const str: string = serialization.encoder(hex, encoding, "hex", "hex")
      const decoded: string = serialization.decoder(str, encoding, "hex", "hex")
      expect(hex).toEqual(decoded)
    })

    test("utf8", (): void => {
      const str: string = serialization.encoder(name, encoding, "utf8", "utf8")
      const decoded: string = serialization.decoder(str, encoding, "utf8", "utf8")
      expect(name).toBe(decoded)
    })

    test("decimalString", (): void => {
      const str: string = serialization.encoder(decimalString, encoding, "decimalString", "decimalString")
      const decoded: string = serialization.decoder(str, encoding, "decimalString", "decimalString")
      expect(decimalString).toBe(decoded)
    })

    test("number", (): void => {
      const str: string = serialization.encoder(num, encoding, "number", "number")
      const decoded: string = serialization.decoder(str, encoding, "number", "number")
      expect(num).toBe(decoded)
    })

    test("Buffer", (): void => {
      const str: string = serialization.encoder(denomination, encoding, "Buffer", "decimalString", 1)
      const decoded: Buffer = serialization.decoder(str, encoding, "decimalString", "Buffer", 1)
      expect(denomination.toString('hex')).toBe(decoded.toString('hex'))
    })
  })
})
