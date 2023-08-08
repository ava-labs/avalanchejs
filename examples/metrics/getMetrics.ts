import "dotenv/config"
import { Avalanche } from "../../src"
import { MetricsAPI } from "../../src/apis/metrics"

const ip = process.env.LOCAL_IP
const port = Number(process.env.LOCAL_PORT)
const protocol = process.env.LOCAL_PROTOCOL
const networkID = Number(process.env.LOCAL_NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const metrics: MetricsAPI = avalanche.Metrics()

const main = async (): Promise<any> => {
  const m: string = await metrics.getMetrics()
  console.log(m)
}

main()
