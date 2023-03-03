import { Avalanche } from "caminojs/index"
import { AdminAPI } from "caminojs/apis/admin"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const admin: AdminAPI = avalanche.Admin()

let xBlockchainID: string

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  xBlockchainID = avalanche.getNetwork().X.blockchainID
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const aliases: string[] = await admin.getChainAliases(xBlockchainID)
  console.log(aliases)
}

main()
