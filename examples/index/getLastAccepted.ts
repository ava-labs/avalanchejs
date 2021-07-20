import { Avalanche } from "../../src"
import { IndexAPI } from "../../src/apis/index"
import { GetLastAcceptedResponse } from "../../src/common/interfaces"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const index: IndexAPI = avalanche.Index()

const main = async (): Promise<any> => {
  const encoding: string = "cb58"
  const baseurl: string = "/ext/index/X/tx"
  const lastAccepted: GetLastAcceptedResponse = await index.getLastAccepted(
    encoding,
    baseurl
  )
  console.log(lastAccepted)
}

main()
