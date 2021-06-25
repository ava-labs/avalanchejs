import BN from 'bn.js'
import { Buffer } from 'buffer/'
import { Serialization, SerializedType } from '../../src/utils'
import { getPreferredHRP } from '../../src/utils'

const serialization: Serialization = Serialization.getInstance()

describe("Serialization", (): void => {
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
      const address: string = "X-avax1wst8jt3z3fm9ce0z6akj3266zmgccdp03hjlaj"
      t = "bech32"
      const chainID: string = "X"
      buf = serialization.typeToBuffer(address, t)
      const hrp: any = getPreferredHRP(1)
      const bech32: string = serialization.bufferToType(buf, t, hrp, chainID)
      expect(bech32).toEqual(address)
    })

    test("nodeID", (): void => {
      const nodeID: string = "NodeID-MFrZFVCXPv5iCn6M9K6XduxGTYp891xXZ"
      t = "nodeID"
      buf = serialization.typeToBuffer(nodeID, t)
      const n: string = serialization.bufferToType(buf, t)
      expect(nodeID).toEqual(n)
    })

    test("privateKey", (): void => {
      const privateKey: string = "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
      t = "privateKey"
      buf = serialization.typeToBuffer(privateKey, t)
      const p: string = serialization.bufferToType(buf, t)
      expect(privateKey).toEqual(p)
    })

    test("cb58", (): void => {
      const cb58: string = "2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed"
      t = "cb58"
      buf = serialization.typeToBuffer(cb58, t)
      const c: string = serialization.bufferToType(buf, t)
      expect(cb58).toEqual(c)
    })

    test("base58", (): void => {
      const cb58: string = "2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed"
      t = "cb58"
      buf = serialization.typeToBuffer(cb58, t)
      const c: string = serialization.bufferToType(buf, t)
      expect(cb58).toEqual(c)
    })

    test("base64", (): void => {
      const base64: string = "ZnJvbSBzbm93Zmxha2UgdG8gQXZhbGFuY2hl"
      t = "base64"
      buf = serialization.typeToBuffer(base64, t)
      const b64: string = serialization.bufferToType(buf, t)
      expect(base64).toEqual(b64)
    })

    test("hex", (): void => {
      const hex: string = "66726f6d20736e6f77666c616b6520746f204176616c616e636865"
      t = "hex"
      buf = serialization.typeToBuffer(hex, t)
      const h: string = serialization.bufferToType(buf, t)
      expect(hex).toEqual(h)
    })

    test("decimalString", (): void => {
      const decimalString: string = "12345"
      t = "decimalString"
      buf = serialization.typeToBuffer(decimalString, t)
      const d: string = serialization.bufferToType(buf, t)
      expect(decimalString).toEqual(d)
    })

    test("number", (): void => {
      const num: number = 12345
      t = "number"
      buf = serialization.typeToBuffer(num, t)
      const nu: string = serialization.bufferToType(buf, t)
      expect(num).toEqual(nu)
    })

    test("utf8", (): void => {
      const utf8: string = "from snowflake to Avalanche"
      t = "utf8"
      buf = serialization.typeToBuffer(utf8, t)
      const u: string = serialization.bufferToType(buf, t)
      expect(utf8).toEqual(u)
    })
  })
})
