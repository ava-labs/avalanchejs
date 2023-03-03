import { Avalanche, BN } from "caminojs/index"
import { EVMAPI } from "caminojs/apis/evm"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
let cchain: EVMAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  cchain = avalanche.CChain()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const baseFeeResponse: string = await cchain.getBaseFee()
  const baseFee: BN = new BN(parseInt(baseFeeResponse))
  console.log(`BaseFee: ${baseFee.toString()}`)
}

main()
