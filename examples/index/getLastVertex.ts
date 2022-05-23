import { Avalanche, BinTools, Buffer } from "../../src"
import { IndexAPI } from "../../src/apis/index/index"
import { GetLastAcceptedResponse } from "../../src/apis/index/interfaces"
import { Tx, UnsignedTx, Vertex } from "../../src/apis/avm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
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
  console.log({ lastVertex })

  const vertex: Vertex = new Vertex()
  const byteLength = vertex.fromBuffer(bintools.cb58Decode(lastVertex.bytes))
  console.log({ byteLength })

  // // TODO Clean up Vertex Retun Data
  //   const buffer = Buffer.from(lastVertex.bytes)
  //   console.log(JSON.stringify({ buffer }))
  //   const newVert2 = vertex.fromBuffer(bintools.cb58Decode(lastAccepted.bytes), 32)

  //   const unsignedTx: UnsignedTx = new UnsignedTx()
  //   unsignedTx.fromBuffer(bintools.cb58Decode(lastAccepted.bytes))
  //   console.log(unsignedTx)
}

main()
