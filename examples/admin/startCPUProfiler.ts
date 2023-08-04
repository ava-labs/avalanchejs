import "dotenv/config"
import { Avalanche } from "../../src"
import { AdminAPI } from "../../src/apis/admin"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const admin: AdminAPI = avalanche.Admin()

const main = async (): Promise<any> => {
  const successful: boolean = await admin.startCPUProfiler()
  console.log(successful)
}

main()
