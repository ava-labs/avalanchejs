import { Avalanche } from "@c4tplatform/caminojs/dist"
import { HealthAPI } from "@c4tplatform/caminojs/dist/apis/health"
import { HealthResponse } from "@c4tplatform/caminojs/dist/apis/health/interfaces"

import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

let health: HealthAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  health = avalanche.Health()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const healthResponse: HealthResponse = await health.health()
  console.log(healthResponse)
}

main()
