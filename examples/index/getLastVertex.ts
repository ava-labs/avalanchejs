import { Avalanche, BinTools, Buffer } from "@c4tplatform/caminojs/dist"
import { IndexAPI } from "@c4tplatform/caminojs/dist/apis/index/index"
import { GetLastAcceptedResponse } from "@c4tplatform/caminojs/dist/apis/index/interfaces"
import { Vertex } from "@c4tplatform/caminojs/dist/apis/avm"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

const bintools: BinTools = BinTools.getInstance()

let index: IndexAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  index = avalanche.Index()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const encoding: string = "cb58"
  const baseurl: string = "/ext/index/X/vtx"
  const lastVertex: GetLastAcceptedResponse = await index.getLastAccepted(
    encoding,
    baseurl
  )
  console.log(lastVertex)

  const vertex: Vertex = new Vertex()
  vertex.fromBuffer(bintools.cb58Decode(lastVertex.bytes))
  console.log(vertex)
  console.log("--------")

  const buf: Buffer = vertex.toBuffer()
  const v: Vertex = new Vertex()
  v.fromBuffer(buf)
  console.log(v)
}

main()
