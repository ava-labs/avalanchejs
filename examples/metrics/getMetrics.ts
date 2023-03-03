import { Avalanche } from "caminojs/index"
import { MetricsAPI } from "caminojs/apis/metrics"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

let metrics: MetricsAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  metrics = avalanche.Metrics()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const m: string = await metrics.getMetrics()
  console.log(m)
}

main()
