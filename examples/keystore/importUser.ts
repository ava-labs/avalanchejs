// This file read secrets from a separate file called "secrets.json"
// which you can create based on "secrets.example" which is in the
// root of the `examples/` directory.
// Unlike "secrets.example", "secrets.json" should never be committed to git.
import { readFile } from "fs"
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
  const path: string = "./examples/secrets.json"
  const encoding: "utf8" = "utf8"
  const cb = async (err: any, data: any): Promise<void> => {
    if (err) throw err
    const jsonData: any = JSON.parse(data)
    const username: string = "username"
    const password: string = jsonData.password
    const user: string = jsonData.user
    const successful: boolean = await keystore.importUser(
      username,
      user,
      password
    )
    console.log(successful)
  }
  readFile(path, encoding, cb)
}

main()
