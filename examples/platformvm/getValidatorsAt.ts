import { Avalanche } from "caminojs/index"
import { GetValidatorsAtResponse } from "caminojs/apis/platformvm/interfaces"
import { PlatformVMAPI } from "caminojs/apis/platformvm"
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

  const height: number = 0
  const subnetID: string = "11111111111111111111111111111111LpoYY"
  const validators: GetValidatorsAtResponse = await pchain.getValidatorsAt(
    height,
    subnetID
  )
  console.log(validators)
}

main()
