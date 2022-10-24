import { Avalanche, BinTools, Buffer } from "../../src"
import { IndexAPI } from "../../src/apis/index/index"
import { GetLastAcceptedResponse } from "../../src/apis/index/interfaces"
import { Vertex } from "../../src/apis/avm"

const ip: string = "indexer-demo.avax.network"
const port: number = 443
const protocol: string = "https"
const networkID: number = 1
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const index: IndexAPI = avalanche.Index()
const bintools: BinTools = BinTools.getInstance()

const main = async (): Promise<any> => {
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
