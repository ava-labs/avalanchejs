import { Avalanche } from "caminojs/index"
import { IndexAPI } from "caminojs/apis/index"
import { GetLastAcceptedResponse } from "caminojs/apis/index/interfaces"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

let index: IndexAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  index = avalanche.Index()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const encoding: string = "hex"
  const baseurl: string = "/ext/index/X/tx"
  const lastAccepted: GetLastAcceptedResponse = await index.getLastAccepted(
    encoding,
    baseurl
  )
  console.log(lastAccepted)
}

main()
