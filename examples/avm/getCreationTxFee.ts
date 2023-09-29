import { Avalanche, BN } from "caminojs/index"
import { AVMAPI } from "caminojs/apis/avm"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

const main = async (): Promise<any> => {
  await avalanche.fetchNetworkSettings()
  const txFee: BN = avalanche.XChain().getCreationTxFee()
  console.log(txFee)
}

main()
