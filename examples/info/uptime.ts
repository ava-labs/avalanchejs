import { Avalanche } from "@avalabs/avalanchejs/dist"
import { InfoAPI } from "@avalabs/avalanchejs/dist/apis/info"
import { UptimeResponse } from "@avalabs/avalanchejs/dist/apis/info/interfaces"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const info: InfoAPI = avalanche.Info()

const main = async (): Promise<any> => {
  const uptimeResponse: UptimeResponse = await info.uptime()
  console.log(uptimeResponse)
}

main()
