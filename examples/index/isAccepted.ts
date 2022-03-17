import { Avalanche } from "../../src"
import { IndexAPI } from "../../src/apis/index"
import { IsAcceptedResponse } from "../../src/apis/index/interfaces"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const index: IndexAPI = avalanche.Index()

const main = async (): Promise<any> => {
  const containerID: string =
    "eLXEKFFMgGmK7ZLokCFjppdBfGy5hDuRqh5uJVyXXPaRErpAX"
  const encoding: string = "hex"
  const baseurl: string = "/ext/index/X/tx"
  const containerRange: IsAcceptedResponse = await index.isAccepted(
    containerID,
    encoding,
    baseurl
  )
  console.log(containerRange)
}

main()
