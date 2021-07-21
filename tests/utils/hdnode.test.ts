import Avalanche, { HDNode, Mnemonic } from "src"
import { Buffer } from "buffer/"
import { AVMAPI, KeyChain } from "src/apis/avm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const mnemonic: Mnemonic = Mnemonic.getInstance()
const xchain: AVMAPI = avalanche.XChain()
const xKeychain: KeyChain = xchain.keyChain()

describe("HDNode", (): void => {
  const xPriv: string =
    "xprv9s21ZrQH143K4RH1nRkHwuVz3qGREBLobwUoUBowLDucQXm4do8jvz12agvjHrAwjJXtq9BZ87WBPUPScDBnjKvBKVQ5xbS7GQwJKW7vXLD"
  const childXPriv: string =
    "xprvA7X7udsZk3q9mNMcGnN8PKHv5eHm6JA3TRzW2HsWnrYHbccXh5YMnRLA83VCPKWQUFmKf9AfCXSmoFs7HJ8Yr1LK52wJDVk262vGFszM4nb"
  const xPub: string =
    "xpub661MyMwAqRbcFSdAk5S6UECmA6MFQWiRBfPU5AsVcmrKY5HoFKPNYrKEq7isvaZVfNxhkrv5oXxFpQc6AVEcVW5NxeamKD6LyLUDMntbnq7"
  const seed: string =
    "a0c42a9c3ac6abf2ba6a9946ae83af18f51bf1c9fa7dacc4c92513cc4dd015834341c775dcd4c0fac73547c5662d81a9e9361a0aac604a73a321bd9103bce8af"
  const msg: string = "bb413645935a9bf1ecf0c3d30df2d573"
  const m: string =
    "immune year obscure laptop wage diamond join glue ecology envelope box fade mixed cradle athlete absorb stick rival punch dinosaur skin blind benefit pretty"
  const addrs: string[] = [
    "X-avax15qwuklmrfcmfw78yvka9pjsukjeevl4aveehq0",
    "X-avax13wqaxm6zgjq5qwzuyyxyl9yrz3edcgwgfht6gt",
    "X-avax1z3dn3vczxttts8dsdjfgtnkekf8nvqhhsj5stl",
    "X-avax1j6kze9n7r3e8wq6jta5mf6pd3fwnu0v9wygc8p",
    "X-avax1ngasfmvl8g63lzwznp0374myz7ajt4746g750m",
    "X-avax1pr7pzcggtrk6uap58sfsrlnhqhayly2gtlux9l",
    "X-avax1wwtn3gx7ke4ge2c29eg5sun36nyj55u4dle9gn",
    "X-avax13527pvlnxa4wrfgt0h8ya7nkjawqq29sv5s89x",
    "X-avax1gw6agtcsz969ugpqh2zx2lmjchg6npklvp43qq",
    "X-avax10agjetvj0a0vf6wtlh7s6ctr8ha8ch8km8z567"
  ]

  test("derive", (): void => {
    const hdnode: HDNode = new HDNode(seed)
    const path: string = "m/9000'/2614666'/4849181'/4660'/2'/1/3"
    const child = hdnode.derive(path)
    expect(child.privateExtendedKey).toBe(childXPriv)
  })

  test("fromMasterSeedBuffer", (): void => {
    const hdnode: HDNode = new HDNode(Buffer.from(seed))
    expect(hdnode.privateExtendedKey).toBe(xPriv)
  })

  test("fromMasterSeedString", (): void => {
    const hdnode: HDNode = new HDNode(seed)
    expect(hdnode.privateExtendedKey).toBe(xPriv)
  })

  test("fromXPriv", (): void => {
    const hdnode: HDNode = new HDNode(xPriv)
    expect(hdnode.privateExtendedKey).toBe(xPriv)
  })

  test("fromXPub", (): void => {
    const hdnode: HDNode = new HDNode(xPub)
    expect(hdnode.publicExtendedKey).toBe(xPub)
  })

  test("sign", (): void => {
    const hdnode: HDNode = new HDNode(xPriv)
    const sig: Buffer = hdnode.sign(Buffer.from(msg))
    expect(Buffer.isBuffer(sig)).toBeTruthy()
  })

  test("verify", (): void => {
    const hdnode: HDNode = new HDNode(xPriv)
    const sig: Buffer = hdnode.sign(Buffer.from(msg))
    const verify: boolean = hdnode.verify(Buffer.from(msg), sig)
    expect(verify).toBeTruthy()
  })

  test("wipePrivateData", (): void => {
    const hdnode: HDNode = new HDNode(xPriv)
    hdnode.wipePrivateData()
    expect(hdnode.privateKey).toBeNull()
  })

  test("BIP44", (): void => {
    const seed: Buffer = mnemonic.mnemonicToSeedSync(m)
    const hdnode: HDNode = new HDNode(seed)
    for (let i: number = 0; i <= 9; i++) {
      const child: HDNode = hdnode.derive(`m/44'/9000'/0'/0/${i}`)
      xKeychain.importKey(child.privateKeyCB58)
    }
    const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
    expect(xAddressStrings).toStrictEqual(addrs)
  })
})
