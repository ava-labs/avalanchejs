import { Avalanche } from "../../dist"
import { AVMAPI, KeyChain } from "../../dist/apis/avm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()

const main = async (): Promise<any> => {
  const keyChain: KeyChain = xchain.newKeyChain()
  console.log(keyChain)
}

main()
