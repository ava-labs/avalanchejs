import { Avalanche } from "@c4tplatform/caminojs/dist"
import { AdminAPI } from "@c4tplatform/caminojs/dist/apis/admin"
import { GetLoggerLevelResponse } from "@c4tplatform/caminojs/dist/apis/admin/interfaces"
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
  const loggerName: string = "C"
  const loggerLevel: GetLoggerLevelResponse = await admin.getLoggerLevel(
    loggerName
  )
  console.log(loggerLevel)
}

main()
