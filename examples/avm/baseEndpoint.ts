import "dotenv/config"
import { Avalanche } from "../../src"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
const baseEndpoint: string = "rpc"
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
avalanche.setAddress(ip, port, protocol, baseEndpoint)

const main = async (): Promise<any> => {
  const baseEndpoint: string = avalanche.getBaseEndpoint()
  console.log(baseEndpoint)
}

main()
