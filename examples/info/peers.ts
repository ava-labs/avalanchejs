import { Avalanche } from "caminojs/index"
import { InfoAPI } from "caminojs/apis/info"
import { PeersResponse } from "caminojs/apis/info/interfaces"
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
  const peers: PeersResponse[] = await info.peers([])
  console.log(peers)
}

main()
