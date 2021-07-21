import { Avalanche } from "../../src"
import { IndexAPI } from "../../src/apis/index"
import { GetContainerByIDResponse } from "../../src/common/interfaces"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const index: IndexAPI = avalanche.Index()

const main = async (): Promise<any> => {
  const containerID: string =
    "2ceDnmxh59AsXqTG95vf3dr2a7ohXprNn9mvWgQJ39uHryBecT"
  const encoding: string = "cb58"
  const baseurl: string = "/ext/index/C/block"
  const containerByIndex: GetContainerByIDResponse =
    await index.getContainerByID(containerID, encoding, baseurl)
  console.log(containerByIndex)
}

main()
