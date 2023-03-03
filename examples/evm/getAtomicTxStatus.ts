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
  const txID: string = "FCry2Z1Su9KZqK1XRMhxQS6XuPorxDm3C3RBT7hw32ojiqyvP"
  const status: string = await cchain.getAtomicTxStatus(txID)
  console.log(status)
}

main()
