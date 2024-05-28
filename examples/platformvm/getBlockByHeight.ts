import { Avalanche } from "caminojs/index"
import { PlatformVMAPI } from "caminojs/apis/platformvm"
import { ExamplesConfig } from "../common/examplesConfig"
import { GetBlockResponse } from "caminojs/common"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

let pchain: PlatformVMAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const height: number = 0
  const encoding: string = "hexnc"
  const block: GetBlockResponse = await pchain.getBlockByHeight(
    height,
    encoding
  )

  console.log(block)
}
main()
