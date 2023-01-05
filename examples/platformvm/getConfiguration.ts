import { Avalanche } from "@c4tplatform/caminojs/dist"
import { GetConfigurationResponse } from "@c4tplatform/caminojs/dist/apis/platformvm/interfaces"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const configurationResponse: GetConfigurationResponse = await avalanche
    .PChain()
    .getConfiguration()
  console.log(configurationResponse)
}

main()
