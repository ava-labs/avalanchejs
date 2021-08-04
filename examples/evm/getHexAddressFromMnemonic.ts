import { Avalanche, BinTools, Buffer } from "../../src"
import { EVMAPI, KeyChain } from "../../src/apis/evm"
import HDNode from "../../src/utils/hdnode"
import Mnemonic from "../../src/utils/mnemonic"
const mnemonic: Mnemonic = Mnemonic.getInstance()

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const bintools: BinTools = BinTools.getInstance()

const main = async (): Promise<any> => {
  const cchain: EVMAPI = avalanche.CChain()

  const cKeychain: KeyChain = cchain.keyChain()
  const m: string =
    "output tooth keep tooth bracket fox city sustain blood raise install pond stem reject long scene clap gloom purpose mean music piece unknown light"
  const mnemonicToSeed: Buffer = await mnemonic.mnemonicToSeed(m)
  const fromSeed = new HDNode(mnemonicToSeed)
  const child = fromSeed.derive("m/44'/60'/0'/0/0")
  cKeychain.importKey(child.privateKeyCB58)
  const cAddresses: Buffer[] = cchain.keyChain().getAddresses()

  for (const each of cAddresses) {
    const hexAddress: string = bintools.cb58Encode(each)
    console.log("hexAddress", hexAddress)
    console.log(bintools.isHex(`0x${hexAddress}`))
  }
}

main()
