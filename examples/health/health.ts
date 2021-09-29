import { Avalanche } from "../../src"
import { HealthAPI } from "../../src/apis/health"
import { HealthResponse } from "../../src/apis/health/interfaces"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const health: HealthAPI = avalanche.Health()

const main = async (): Promise<any> => {
  const healthResponse = (await health.health()) as HealthResponse
  console.log(healthResponse)
}

main()
