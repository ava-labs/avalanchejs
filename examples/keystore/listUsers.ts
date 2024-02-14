import "dotenv/config"
import { Avalanche } from "../../src"
import { KeystoreAPI } from "../../src/apis/keystore"

const ip = process.env.LOCAL_IP
const port = Number(process.env.LOCAL_PORT)
const protocol = process.env.LOCAL_PROTOCOL
const networkID = Number(process.env.LOCAL_NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const keystore: KeystoreAPI = avalanche.NodeKeys()

const main = async (): Promise<any> => {
  const users: string[] = await keystore.listUsers()
  console.log(users)
}

main()
