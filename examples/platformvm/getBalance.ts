import { Avalanche } from "@c4tplatform/caminojs/dist"
import { PlatformVMAPI } from "@c4tplatform/caminojs/dist/apis/platformvm"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

let pchain: PlatformVMAPI = avalanche.PChain()

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const address: string = "P-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u00z96u"
  const balance: object = await pchain.getBalance(address)
  console.log(balance)
}

main()
