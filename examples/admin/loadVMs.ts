import "dotenv/config"
import { Avalanche } from "../../src"
import { AdminAPI } from "../../src/apis/admin"
import { LoadVMsResponse } from "../../src/apis/admin/interfaces"

const ip = process.env.LOCAL_IP
const port = Number(process.env.LOCAL_PORT)
const protocol = process.env.LOCAL_PROTOCOL
const networkID = Number(process.env.LOCAL_NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const admin: AdminAPI = avalanche.Admin()

const main = async (): Promise<any> => {
  const loggerLevel: LoadVMsResponse = await admin.loadVMs()
  console.log(loggerLevel)
}

main()
