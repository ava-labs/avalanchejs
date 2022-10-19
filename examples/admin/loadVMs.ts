import { Avalanche } from "avalanche/dist"
import { AdminAPI } from "avalanche/dist/apis/admin"
import { LoadVMsResponse } from "avalanche/dist/apis/admin/interfaces"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const admin: AdminAPI = avalanche.Admin()

const main = async (): Promise<any> => {
  const loggerLevel: LoadVMsResponse = await admin.loadVMs()
  console.log(loggerLevel)
}

main()
