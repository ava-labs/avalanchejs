import { Avalanche } from "caminojs/index"
import { KeystoreAPI } from "caminojs/apis/keystore"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

let keystore: KeystoreAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  keystore = avalanche.NodeKeys()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const username: string = "username"
  const password: string = "Vz48jjHLTCcAepH95nT4B"
  const user: string = await keystore.exportUser(username, password)
  console.log(user)
}

main()
