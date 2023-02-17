import { KeyChain, KeyPair } from "../../../src/apis/platformvm/keychain"
import { Avalanche } from "../../../src/index"
import { Buffer } from "buffer/"
import createHash from "create-hash"
import BinTools from "../../../src/utils/bintools"

const bintools: BinTools = BinTools.getInstance()
const alias: string = "P"
const hrp: string = "tests"
describe("PlatformVMKeyPair", (): void => {
  const networkID: number = 1337
  const ip: string = "127.0.0.1"
  const port: number = 9650
  const protocol: string = "https"
  const avalanche: Avalanche = new Avalanche(
    ip,
    port,
    protocol,
    networkID,
    undefined,
    undefined,
    undefined,
    true
  )

  test("human readable part", (): void => {
    let hrp: string = avalanche.getHRP()
    let networkID: number = avalanche.getNetworkID()
    expect(hrp).toBe("custom")
    expect(networkID).toBe(1337)

    avalanche.setNetworkID(2)
    hrp = avalanche.getHRP()
    networkID = avalanche.getNetworkID()
    expect(hrp).toBe("cascade")
    expect(networkID).toBe(2)

    avalanche.setNetworkID(3)
    hrp = avalanche.getHRP()
    networkID = avalanche.getNetworkID()
    expect(hrp).toBe("denali")
    expect(networkID).toBe(3)

    avalanche.setNetworkID(4)
    hrp = avalanche.getHRP()
    networkID = avalanche.getNetworkID()
    expect(hrp).toBe("everest")
    expect(networkID).toBe(4)

    avalanche.setNetworkID(0)
    hrp = avalanche.getHRP()
    networkID = avalanche.getNetworkID()
    expect(hrp).toBe("custom")
    expect(networkID).toBe(0)

    avalanche.setNetworkID(1)
    hrp = avalanche.getHRP()
    networkID = avalanche.getNetworkID()
    expect(hrp).toBe("avax")
    expect(networkID).toBe(1)

    avalanche.setNetworkID(12345)
    hrp = avalanche.getHRP()
    networkID = avalanche.getNetworkID()
    expect(hrp).toBe("local")
    expect(networkID).toBe(12345)
  })

  // See: https://bitcointalk.org/index.php?topic=285142.msg3300992#msg3300992
  // as the source of the RFC6979 test vectors.
  test("rfc6979 1", (): void => {
    const kp: KeyPair = new KeyPair(hrp, alias)
    kp.importKey(
      Buffer.from(
        "0000000000000000000000000000000000000000000000000000000000000001",
        "hex"
      )
    )

    const msg: Buffer = Buffer.from(
      createHash("sha256")
        .update(
          Buffer.from(
            "Everything should be made as simple as possible, but not simpler."
          )
        )
        .digest("hex"),
      "hex"
    )
    const sig: string = kp.sign(msg).slice(0, 64).toString("hex")

    expect(sig).toBe(
      "33a69cd2065432a30f3d1ce4eb0d59b8ab58c74f27c41a7fdb5696ad4e6108c96f807982866f785d3f6418d24163ddae117b7db4d5fdf0071de069fa54342262"
    )
  })

  test("rfc6979 2", (): void => {
    const kp: KeyPair = new KeyPair(hrp, alias)
    kp.importKey(
      Buffer.from(
        "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140",
        "hex"
      )
    )

    const msg: Buffer = Buffer.from(
      createHash("sha256")
        .update(
          Buffer.from(
            "Equations are more important to me, because politics is for the present, but an equation is something for eternity."
          )
        )
        .digest("hex"),
      "hex"
    )
    const sig: string = kp.sign(msg).slice(0, 64).toString("hex")

    expect(sig).toBe(
      "54c4a33c6423d689378f160a7ff8b61330444abb58fb470f96ea16d99d4a2fed07082304410efa6b2943111b6a4e0aaa7b7db55a07e9861d1fb3cb1f421044a5"
    )
  })

  test("rfc6979 3", (): void => {
    const kp: KeyPair = new KeyPair(hrp, alias)
    kp.importKey(
      Buffer.from(
        "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140",
        "hex"
      )
    )

    const msg: Buffer = Buffer.from(
      createHash("sha256")
        .update(
          Buffer.from(
            "Not only is the Universe stranger than we think, it is stranger than we can think."
          )
        )
        .digest("hex"),
      "hex"
    )
    const sig: string = kp.sign(msg).slice(0, 64).toString("hex")

    expect(sig).toBe(
      "ff466a9f1b7b273e2f4c3ffe032eb2e814121ed18ef84665d0f515360dab3dd06fc95f5132e5ecfdc8e5e6e616cc77151455d46ed48f5589b7db7771a332b283"
    )
  })

  test("rfc6979 4", (): void => {
    const kp: KeyPair = new KeyPair(hrp, alias)
    kp.importKey(
      Buffer.from(
        "0000000000000000000000000000000000000000000000000000000000000001",
        "hex"
      )
    )

    const msg: Buffer = Buffer.from(
      createHash("sha256")
        .update(
          Buffer.from(
            "How wonderful that we have met with a paradox. Now we have some hope of making progress."
          )
        )
        .digest("hex"),
      "hex"
    )
    const sig: string = kp.sign(msg).slice(0, 64).toString("hex")

    expect(sig).toBe(
      "c0dafec8251f1d5010289d210232220b03202cba34ec11fec58b3e93a85b91d375afdc06b7d6322a590955bf264e7aaa155847f614d80078a90292fe205064d3"
    )
  })

  test("rfc6979 5", (): void => {
    const kp: KeyPair = new KeyPair(hrp, alias)
    kp.importKey(
      Buffer.from(
        "69ec59eaa1f4f2e36b639716b7c30ca86d9a5375c7b38d8918bd9c0ebc80ba64",
        "hex"
      )
    )

    const msg: Buffer = Buffer.from(
      createHash("sha256")
        .update(
          Buffer.from(
            "Computer science is no more about computers than astronomy is about telescopes."
          )
        )
        .digest("hex"),
      "hex"
    )
    const sig: string = kp.sign(msg).slice(0, 64).toString("hex")

    expect(sig).toBe(
      "7186363571d65e084e7f02b0b77c3ec44fb1b257dee26274c38c928986fea45d0de0b38e06807e46bda1f1e293f4f6323e854c86d58abdd00c46c16441085df6"
    )
  })

  test("rfc6979 6", (): void => {
    const kp: KeyPair = new KeyPair(hrp, alias)
    kp.importKey(
      Buffer.from(
        "00000000000000000000000000007246174ab1e92e9149c6e446fe194d072637",
        "hex"
      )
    )

    const msg: Buffer = Buffer.from(
      createHash("sha256")
        .update(
          Buffer.from(
            "...if you aren't, at any given time, scandalized by code you wrote five or even three years ago, you're not learning anywhere near enough"
          )
        )
        .digest("hex"),
      "hex"
    )
    const sig: string = kp.sign(msg).slice(0, 64).toString("hex")

    expect(sig).toBe(
      "fbfe5076a15860ba8ed00e75e9bd22e05d230f02a936b653eb55b61c99dda4870e68880ebb0050fe4312b1b1eb0899e1b82da89baa5b895f612619edf34cbd37"
    )
  })

  test("rfc6979 7", (): void => {
    const kp: KeyPair = new KeyPair(hrp, alias)
    kp.importKey(
      Buffer.from(
        "000000000000000000000000000000000000000000056916d0f9b31dc9b637f3",
        "hex"
      )
    )

    const msg: Buffer = Buffer.from(
      createHash("sha256")
        .update(
          Buffer.from(
            "The question of whether computers can think is like the question of whether submarines can swim."
          )
        )
        .digest("hex"),
      "hex"
    )
    const sig: string = kp.sign(msg).slice(0, 64).toString("hex")

    expect(sig).toBe(
      "cde1302d83f8dd835d89aef803c74a119f561fbaef3eb9129e45f30de86abbf906ce643f5049ee1f27890467b77a6a8e11ec4661cc38cd8badf90115fbd03cef"
    )
  })

  test("repeatable 1", (): void => {
    const kp: KeyPair = new KeyPair(hrp, alias)
    kp.importKey(
      Buffer.from(
        "ef9bf2d4436491c153967c9709dd8e82795bdb9b5ad44ee22c2903005d1cf676",
        "hex"
      )
    )
    expect(kp.getPublicKey().toString("hex")).toBe(
      "033fad3644deb20d7a210d12757092312451c112d04773cee2699fbb59dc8bb2ef"
    )

    const msg: Buffer = Buffer.from(
      createHash("sha256").update(Buffer.from("09090909", "hex")).digest("hex"),
      "hex"
    )
    const sig: Buffer = kp.sign(msg)

    expect(sig.length).toBe(65)
    expect(kp.verify(msg, sig)).toBe(true)
    expect(kp.recover(msg, sig).toString("hex")).toBe(
      kp.getPublicKey().toString("hex")
    )
  })

  test("repeatable 2", (): void => {
    const kp: KeyPair = new KeyPair(hrp, alias)
    kp.importKey(
      Buffer.from(
        "17c692d4a99d12f629d9f0ff92ec0dba15c9a83e85487b085c1a3018286995c6",
        "hex"
      )
    )
    expect(kp.getPublicKey().toString("hex")).toBe(
      "02486553b276cfe7abf0efbcd8d173e55db9c03da020c33d0b219df24124da18ee"
    )

    const msg: Buffer = Buffer.from(
      createHash("sha256").update(Buffer.from("09090909", "hex")).digest("hex"),
      "hex"
    )
    const sig: Buffer = kp.sign(msg)

    expect(sig.length).toBe(65)
    expect(kp.verify(msg, sig)).toBe(true)
    expect(kp.recover(msg, sig).toString("hex")).toBe(
      kp.getPublicKey().toString("hex")
    )
  })

  test("repeatable 3", (): void => {
    const kp: KeyPair = new KeyPair(hrp, alias)
    kp.importKey(
      Buffer.from(
        "d0e17d4b31380f96a42b3e9ffc4c1b2a93589a1e51d86d7edc107f602fbc7475",
        "hex"
      )
    )
    expect(kp.getPublicKey().toString("hex")).toBe(
      "031475b91d4fcf52979f1cf107f058088cc2bea6edd51915790f27185a7586e2f2"
    )

    const msg: Buffer = Buffer.from(
      createHash("sha256").update(Buffer.from("09090909", "hex")).digest("hex"),
      "hex"
    )
    const sig: Buffer = kp.sign(msg)

    expect(sig.length).toBe(65)
    expect(kp.verify(msg, sig)).toBe(true)
    expect(kp.recover(msg, sig).toString("hex")).toBe(
      kp.getPublicKey().toString("hex")
    )
  })

  test("Creation Empty", (): void => {
    const kp: KeyPair = new KeyPair(hrp, alias)
    expect(kp.getPrivateKey()).not.toBeUndefined()
    expect(kp.getAddress()).not.toBeUndefined()
    expect(kp.getPrivateKeyString()).not.toBeUndefined()
    expect(kp.getPublicKey()).not.toBeUndefined()
    expect(kp.getPublicKeyString()).not.toBeUndefined()
    const msg: Buffer = Buffer.from(
      createHash("sha256").update(Buffer.from("09090909", "hex")).digest("hex"),
      "hex"
    )
    const sig: Buffer = kp.sign(msg)

    expect(sig.length).toBe(65)
    expect(kp.verify(msg, sig)).toBe(true)
    expect(kp.recover(msg, sig).toString("hex")).toBe(
      kp.getPublicKey().toString("hex")
    )
  })
})

describe("PlatformVMKeyChain", (): void => {
  test("importKey from Buffer", (): void => {
    const keybuff: Buffer = Buffer.from(
      "d0e17d4b31380f96a42b3e9ffc4c1b2a93589a1e51d86d7edc107f602fbc7475",
      "hex"
    )
    const kc: KeyChain = new KeyChain(hrp, alias)
    const kp2: KeyPair = new KeyPair(hrp, alias)
    const addr1: Buffer = kc.importKey(keybuff).getAddress()
    const kp1: KeyPair = kc.getKey(addr1)
    kp2.importKey(keybuff)
    const addr2 = kp1.getAddress()
    expect(addr1.toString("hex")).toBe(addr2.toString("hex"))
    expect(kp1.getPrivateKeyString()).toBe(kp2.getPrivateKeyString())
    expect(kp1.getPublicKeyString()).toBe(kp2.getPublicKeyString())
    expect(kc.hasKey(addr1)).toBe(true)
  })

  test("importKey from Buffer with leading zeros", (): void => {
    const keybuff: Buffer = Buffer.from(
      "00007d4b31380f96a42b3e9ffc4c1b2a93589a1e51d86d7edc107f602fbc7475",
      "hex"
    )
    expect(keybuff.length).toBe(32)
    const kc: KeyChain = new KeyChain(hrp, alias)
    const kp2: KeyPair = new KeyPair(hrp, alias)
    const addr1: Buffer = kc.importKey(keybuff).getAddress()
    const kp1: KeyPair = kc.getKey(addr1)
    kp2.importKey(keybuff)
    const addr2 = kp1.getAddress()
    expect(addr1.toString("hex")).toBe(addr2.toString("hex"))
    expect(kp1.getPrivateKeyString()).toBe(kp2.getPrivateKeyString())
    expect(kp1.getPrivateKey().length).toBe(32)
    expect(kp2.getPrivateKey().length).toBe(32)
    expect(kp1.getPublicKeyString()).toBe(kp2.getPublicKeyString())
    expect(kp1.getPublicKey().length).toBe(33)
    expect(kp2.getPublicKey().length).toBe(33)
    expect(kc.hasKey(addr1)).toBe(true)
  })

  test("importKey from serialized string", (): void => {
    const keybuff: Buffer = Buffer.from(
      "d0e17d4b31380f96a42b3e9ffc4c1b2a93589a1e51d86d7edc107f602fbc7475",
      "hex"
    )
    const kc: KeyChain = new KeyChain(hrp, alias)
    const kp2: KeyPair = new KeyPair(hrp, alias)
    const addr1: Buffer = kc
      .importKey("PrivateKey-" + bintools.cb58Encode(keybuff))
      .getAddress()
    const kp1: KeyPair = kc.getKey(addr1)
    kp2.importKey(keybuff)
    const addr2 = kp1.getAddress()
    expect(addr1.toString("hex")).toBe(addr2.toString("hex"))
    expect(kp1.getPrivateKeyString()).toBe(kp2.getPrivateKeyString())
    expect(kp1.getPublicKeyString()).toBe(kp2.getPublicKeyString())
    expect(kc.hasKey(addr1)).toBe(true)
  })

  test("removeKey via keypair", (): void => {
    const keybuff: Buffer = Buffer.from(
      "d0e17d4b31380f96a42b3e9ffc4c1b2a93589a1e51d86d7edc107f602fbc7475",
      "hex"
    )
    const kc: KeyChain = new KeyChain(hrp, alias)
    const kp1: KeyPair = new KeyPair(hrp, alias)
    const addr1: Buffer = kc.importKey(keybuff).getAddress()
    kp1.importKey(keybuff)
    expect(kc.hasKey(addr1)).toBe(true)
    kc.removeKey(kp1)
    expect(kc.hasKey(addr1)).toBe(false)
  })

  test("removeKey via string", (): void => {
    const keybuff: Buffer = Buffer.from(
      "d0e17d4b31380f96a42b3e9ffc4c1b2a93589a1e51d86d7edc107f602fbc7475",
      "hex"
    )
    const kc: KeyChain = new KeyChain(hrp, alias)
    const addr1: Buffer = kc.importKey(keybuff).getAddress()
    expect(kc.hasKey(addr1)).toBe(true)
    kc.removeKey(addr1)
    expect(kc.hasKey(addr1)).toBe(false)
  })

  test("removeKey bad keys", (): void => {
    const keybuff: Buffer = Buffer.from(
      "d0e17d4b31380f96a42b3e9ffc4c1b2a93589a1e51d86d7edc107f602fbc7475",
      "hex"
    )
    const kc: KeyChain = new KeyChain(hrp, alias)
    const addr1: Buffer = kc.importKey(keybuff).getAddress()
    expect(kc.hasKey(addr1)).toBe(true)
    expect(
      kc.removeKey(bintools.cb58Decode("6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV"))
    ).toBe(false)
  })
})
