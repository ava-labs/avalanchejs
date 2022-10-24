import { Avalanche } from "@c4tplatform/caminojs/dist"
import { KeystoreAPI } from "@c4tplatform/caminojs/dist/apis/keystore"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const keystore: KeystoreAPI = avalanche.NodeKeys()

const main = async (): Promise<any> => {
  const username: string = "username"
  const password: string = "Vz48jjHLTCcAepH95nT4B"
  const user: string = await keystore.exportUser(username, password)
  console.log(user)
}

main()
