import { Avalanche } from "../../src"
import { AdminAPI } from "../../src/apis/admin"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const admin: AdminAPI = avalanche.Admin()

const main = async (): Promise<any> => {
  const successful: boolean = await admin.lockProfile()
  console.log(successful)
}

main()
