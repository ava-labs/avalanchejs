import { Avalanche } from "avalanche/dist"
import { InfoAPI } from "avalanche/dist/apis/info"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const info: InfoAPI = avalanche.Info()

const main = async (): Promise<any> => {
  const alias: string = "X"
  const blockchainID: string = await info.getBlockchainID(alias)
  console.log(blockchainID)
}

main()
