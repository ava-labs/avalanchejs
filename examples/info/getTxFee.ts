import { Avalanche } from "caminojs/index"
import { InfoAPI } from "caminojs/apis/info"
import { GetTxFeeResponse } from "caminojs/apis/info/interfaces"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

let info: InfoAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  info = avalanche.Info()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const iGetTxFeeResponse: GetTxFeeResponse = await info.getTxFee()
  console.log(iGetTxFeeResponse)
}

main()
