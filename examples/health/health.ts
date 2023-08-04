import "dotenv/config"
import { Avalanche } from "../../src"
import { HealthAPI } from "../../src/apis/health"
import { HealthResponse } from "../../src/apis/health/interfaces"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const health: HealthAPI = avalanche.Health()

const main = async (): Promise<any> => {
  const healthResponse: HealthResponse = await health.health()
  console.log(healthResponse)
}

main()
