import { Avalanche } from "@c4tplatform/caminojs/dist"
import { AdminAPI } from "@c4tplatform/caminojs/dist/apis/admin"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const admin: AdminAPI = avalanche.Admin()

const main = async (): Promise<any> => {
  const successful: boolean = await admin.memoryProfile()
  console.log(successful)
}

main()
