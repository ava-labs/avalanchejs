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
const xchain: AVMAPI = avalanche.XChain()

const main = async (): Promise<any> => {
  const fee: BN = new BN(507)
  xchain.setCreationTxFee(fee)
  const txFee: BN = xchain.getCreationTxFee()
  console.log(txFee)
}

main()
