import { Avalanche, Buffer } from "caminojs/index"
import { AVMAPI, KeyChain } from "caminojs/apis/avm"
import { ExamplesConfig } from "../common/examplesConfig"
import { DefaultLocalGenesisPrivateKey, PrivateKeyPrefix } from "caminojs/utils"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
let xchain: AVMAPI
let xKeychain: KeyChain
let xAddressStrings: string[]

const InitAvalanche = async () => {
  xchain = avalanche.XChain()
  xKeychain = xchain.keyChain()
  xKeychain.importKey(privKey)
  xAddressStrings = xchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const addressBuffer: Buffer = xchain.parseAddress(xAddressStrings[0])
  console.log(addressBuffer)
}

main()
