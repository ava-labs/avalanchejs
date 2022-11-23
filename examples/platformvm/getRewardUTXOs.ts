import { Avalanche } from "@c4tplatform/caminojs/dist"
import { GetRewardUTXOsResponse } from "@c4tplatform/caminojs/dist/apis/platformvm/interfaces"
import { PlatformVMAPI } from "@c4tplatform/caminojs/dist/apis/platformvm"
import { ExamplesConfig } from "../common/examplesConfig"

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

  const txID: string = "2nmH8LithVbdjaXsxVQCQfXtzN9hBbmebrsaEYnLM9T32Uy2Y4"
  const encoding: string = "hex"
  const rewardUTXOs: GetRewardUTXOsResponse = await pchain.getRewardUTXOs(
    txID,
    encoding
  )
  console.log(rewardUTXOs)
}

main()
