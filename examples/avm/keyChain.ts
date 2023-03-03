import { Avalanche } from "caminojs/index"
import { AVMAPI, KeyChain } from "caminojs/apis/avm"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const xchain: AVMAPI = avalanche.XChain()

const main = async (): Promise<any> => {
  const keyChain: KeyChain = xchain.keyChain()
  console.log(keyChain)
}

main()
