import { Avalanche } from "@c4tplatform/caminojs/dist"
import { IndexAPI } from "@c4tplatform/caminojs/dist/apis/index"
import { GetContainerByIndexResponse } from "@c4tplatform/caminojs/dist/apis/index/interfaces"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const index: IndexAPI = avalanche.Index()

const main = async (): Promise<any> => {
  const idx: string = "0"
  const encoding: string = "hex"
  const baseurl: string = "/ext/index/X/tx"
  const containerByIndex: GetContainerByIndexResponse =
    await index.getContainerByIndex(idx, encoding, baseurl)
  console.log(containerByIndex)
}

main()
