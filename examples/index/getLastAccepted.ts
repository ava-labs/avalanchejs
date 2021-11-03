import { Avalanche, BinTools, Buffer } from "../../src"
import { Tx, UnsignedTx, Vertex } from "../../src/apis/avm"
import { IndexAPI } from "../../src/apis/index"
import { GetLastAcceptedResponse } from "../../src/apis/index/interfaces"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const index: IndexAPI = avalanche.Index()
const bintools: BinTools = BinTools.getInstance()

const main = async (): Promise<any> => {
  const encoding: string = "hex"
  const baseurl: string = "/ext/index/X/vtx"
  const lastAccepted: GetLastAcceptedResponse = await index.getLastAccepted(
    encoding,
    baseurl
  )
  const vertex: Vertex = new Vertex()
  vertex.fromBuffer(bintools.cb58Decode(lastAccepted.bytes), 2)
  console.log(Vertex)
  // const unsignedTx: UnsignedTx = new UnsignedTx()
  // unsignedTx.fromBuffer(bintools.cb58Decode(lastAccepted.bytes))
}

main()
