import { Avalanche } from "avalanche/dist"
import { AdminAPI } from "avalanche/dist/apis/admin"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const admin: AdminAPI = avalanche.Admin()

const main = async (): Promise<any> => {
  const endpoint: string = "/ext/bc/X"
  const alias: string = "xchain"
  const successful: boolean = await admin.alias(endpoint, alias)
  console.log(successful)
}

main()
