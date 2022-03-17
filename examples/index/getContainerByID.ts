import { Avalanche } from "../../src"
import { IndexAPI } from "../../src/apis/index"
import { GetContainerByIDResponse } from "../../src/apis/index/interfaces"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const index: IndexAPI = avalanche.Index()

const main = async (): Promise<any> => {
  const containerID: string =
    "GwNpFGDWwzBxiq2Goqr3FqTyT3toyGr7LMCUG3tm72wt39xDZ"
  const encoding: string = "hex"
  const baseurl: string = "/ext/index/X/tx"
  const containerByIndex: GetContainerByIDResponse =
    await index.getContainerByID(containerID, encoding, baseurl)
  console.log(containerByIndex)
}

main()
