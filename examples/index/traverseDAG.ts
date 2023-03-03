import { Avalanche, Buffer } from "caminojs/index"
import { Vertex } from "caminojs/apis/avm"
import { IndexAPI } from "caminojs/apis/index"
import {
  GetContainerByIndexResponse,
  GetLastAcceptedResponse
} from "caminojs/apis/index/interfaces"

import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

const sleep = (ms: number): Promise<unknown> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
const mstimeout: number = 1000

let index: IndexAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  index = avalanche.Index()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const encoding: string = "hex"
  const baseurl: string = "/ext/index/X/vtx"
  const lastAccepted: GetLastAcceptedResponse = await index.getLastAccepted(
    encoding,
    baseurl
  )
  console.log("LAST ACCEPTED", lastAccepted)

  await sleep(mstimeout)

  let idx: string = (parseInt(lastAccepted.index) - 1).toString()
  while (parseInt(idx) >= 1) {
    const containerByIndex: GetContainerByIndexResponse =
      await index.getContainerByIndex(idx, encoding, baseurl)
    console.log(`CONTAINER BY INDEX: ${idx}`, containerByIndex)
    idx = (parseInt(containerByIndex.index) - 1).toString()

    const buffer: Buffer = new Buffer(containerByIndex.bytes.slice(2), "hex")
    // console.log(buffer)
    const vertex: Vertex = new Vertex()
    vertex.fromBuffer(buffer)
    // const b: Buffer = vertex.toBuffer()
    // console.log(b.toString("hex"))
    console.log(vertex)
    console.log("-------------")
  }
}

main()
