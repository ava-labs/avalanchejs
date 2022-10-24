import { Avalanche } from "@c4tplatform/caminojs/dist"
import { InfoAPI } from "@c4tplatform/caminojs/dist/apis/info"
import { UptimeResponse } from "@c4tplatform/caminojs/dist/apis/info/interfaces"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const info: InfoAPI = avalanche.Info()

const main = async (): Promise<any> => {
  const uptimeResponse: UptimeResponse = await info.uptime()
  console.log(uptimeResponse)
}

main()
