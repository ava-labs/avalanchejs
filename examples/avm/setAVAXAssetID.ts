import { Avalanche, Buffer } from "caminojs/index"
import { AVMAPI } from "caminojs/apis/avm"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const xchain: AVMAPI = avalanche.XChain()

const main = async (): Promise<any> => {
  const newAssetID: string = "11FtAxv"
  xchain.setAVAXAssetID(newAssetID)
  const assetID: Buffer = await xchain.getAVAXAssetID()
  console.log(assetID)
}

main()
