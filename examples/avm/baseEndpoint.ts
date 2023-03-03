import { Avalanche } from "caminojs/index"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const baseEndpoint: string = "rpc"
avalanche.setNetwork(
  config.host,
  config.port,
  config.protocol,
  config.networkID,
  baseEndpoint
)

const main = async (): Promise<any> => {
  const baseEndpoint: string = avalanche.getBaseEndpoint()
  console.log(baseEndpoint)
}

main()
