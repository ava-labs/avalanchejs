import "dotenv/config"
import { Avalanche } from "../../src"
import { InfoAPI } from "../../src/apis/info"
import { UptimeResponse } from "../../src/apis/info/interfaces"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const info: InfoAPI = avalanche.Info()

const main = async (): Promise<any> => {
  const uptimeResponse: UptimeResponse = await info.uptime()
  console.log(uptimeResponse)
}

main()
