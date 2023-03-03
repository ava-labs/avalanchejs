import { Avalanche } from "caminojs/index"
import { EVMAPI } from "caminojs/apis/evm"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
let cchain: EVMAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  cchain = avalanche.CChain()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const txID: string = "2GD5SRYJQr2kw5jE73trBFiAgVQyrCaeg223TaTyJFYXf2kPty"
  const status: string = await cchain.getAtomicTx(txID)
  console.log(status)
}

main()
