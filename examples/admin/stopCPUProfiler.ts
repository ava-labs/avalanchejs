import { Avalanche } from "@c4tplatform/caminojs/dist"
import { AdminAPI } from "@c4tplatform/caminojs/dist/apis/admin"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const admin: AdminAPI = avalanche.Admin()

const main = async (): Promise<any> => {
  const successful: boolean = await admin.stopCPUProfiler()
  console.log(successful)
}

main()
