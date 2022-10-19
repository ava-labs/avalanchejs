import { Avalanche } from "avalanche/dist"
import { AdminAPI } from "avalanche/dist/apis/admin"
import { Defaults } from "avalanche/dist/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const admin: AdminAPI = avalanche.Admin()

const main = async (): Promise<any> => {
  const blockchain: string = Defaults.network[networkID].X.blockchainID
  const aliases: string[] = await admin.getChainAliases(blockchain)
  console.log(aliases)
}

main()
