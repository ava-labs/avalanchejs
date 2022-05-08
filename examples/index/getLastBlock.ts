import { Avalanche, BinTools, Buffer } from "../../src"
import { IndexAPI } from "../../src/apis/index/index"
import { GetLastAcceptedResponse } from "../../src/apis/index/interfaces"
import { Tx, UnsignedTx, Vertex } from "../../src/apis/avm"
import Web3 from "Web3"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const index: IndexAPI = avalanche.Index()
const bintools: BinTools = BinTools.getInstance()

const main = async (): Promise<any> => {
  // const encoding: string = "cb58"
  // const baseurl: string = "/ext/index/X/vtx"
  // const lastVertex: GetLastAcceptedResponse = await index.getLastAccepted(
  //   encoding,
  //   baseurl
  // )
  // console.log({ lastVertex })
  var web3 = new Web3("https://api.avax-test.network/ext/bc/C/rpc")
  const blockNum = await web3.eth.getBlockNumber()
  const block = await web3.eth.getBlock(blockNum)

  console.log({ BlockNumber: blockNum })
  console.log({ BlockHash: block })

  const txnHashes = block.transactions
  const txnCount = txnHashes.length
  const blockHash = block.hash
  // for(let i = 0; i > txnCount; i++ ){
  // console.log(`${txnHashes[i]}`)

  // console.log(txnCount, txnHashes)
  console.log({ BlockHash: blockHash })
  console.log("txns: " + txnCount, txnHashes)
  // console.log("txns: " + txnCount, txnHashes, txnArray)

  // const vertex: Vertex = new Vertex()
  // const byteLength = vertex.fromBuffer(bintools.cb58Decode(lastVertex.bytes))
  // console.log({ byteLength })

  // const buffer = Buffer.from(lastVertex.bytes)
  // console.log(JSON.stringify({ buffer }))
  // const newVert2 = vertex.fromBuffer(bintools.cb58Decode(lastAccepted.bytes), 32)

  // const unsignedTx: UnsignedTx = new UnsignedTx()
  // unsignedTx.fromBuffer(bintools.cb58Decode(lastAccepted.bytes))
  // console.log(unsignedTx)
}

main()
