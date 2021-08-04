import { Avalanche, BinTools, Buffer } from "../../src"
import { EVMAPI, KeyChain } from "../../src/apis/evm"

import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const cchain: EVMAPI = avalanche.CChain()
const bintools: BinTools = BinTools.getInstance()
const cKeychain: KeyChain = cchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
cKeychain.importKey(privKey)
const cAddresses: Buffer[] = cchain.keyChain().getAddresses()

const main = async (): Promise<any> => {
  for (const each of cAddresses) {
    let hexAddress = bintools.cb58Encode(each)
    console.log("hexAddress", hexAddress)
    console.log(bintools.isHex(`0x${hexAddress}`))
  }
}

main()
