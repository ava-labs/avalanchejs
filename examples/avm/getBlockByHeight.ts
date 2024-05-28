import { Avalanche } from "caminojs/index"
import { AVMAPI } from "caminojs/apis/avm"
import { ExamplesConfig } from "../common/examplesConfig"
import { GetBlockResponse } from "caminojs/common"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

let xchain: AVMAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  xchain = avalanche.XChain()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const height: number = 0
  const encoding: string = "hexnc"
  const block: GetBlockResponse = await xchain.getBlockByHeight(
    height,
    encoding
  )

  console.log(block)
}
main()
