import { Avalanche } from "avalanche/dist"
import { IndexAPI } from "avalanche/dist/apis/index"
import { GetLastAcceptedResponse } from "avalanche/dist/apis/index/interfaces"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const index: IndexAPI = avalanche.Index()

const main = async (): Promise<any> => {
  const encoding: string = "hex"
  const baseurl: string = "/ext/index/X/tx"
  const lastAccepted: GetLastAcceptedResponse = await index.getLastAccepted(
    encoding,
    baseurl
  )
  console.log(lastAccepted)
}

main()
