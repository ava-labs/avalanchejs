import "dotenv/config"
import { Avalanche } from "../../src"
import { HealthAPI } from "../../src/apis/health"
import { HealthResponse } from "../../src/apis/health/interfaces"

const ip = process.env.LOCAL_IP
const port = Number(process.env.LOCAL_PORT)
const protocol = process.env.LOCAL_PROTOCOL
const networkID = Number(process.env.LOCAL_NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const health: HealthAPI = avalanche.Health()

const main = async (): Promise<any> => {
  const healthResponse: HealthResponse = await health.health()
  console.log(healthResponse)
}

main()
