import { Avalanche } from "caminojs/index"
import { PlatformVMAPI } from "caminojs/apis/platformvm"
import { ExamplesConfig } from "../common/examplesConfig"
import { json } from "stream/consumers"

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
  try {
    await InitAvalanche()

    const phases = await pchain.getUpgradePhases()
    console.log(phases)
  } catch (e: any) {
    if ((e.message as string).indexOf("platform.GetUpgradePhases") > 0)
      console.log("Not implemented")
    else console.log(e)
  }
}

main()
