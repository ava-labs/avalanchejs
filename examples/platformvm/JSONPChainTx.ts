import "dotenv/config"
import { Avalanche, Buffer } from "../../src"
import { PlatformVMAPI, Tx } from "../../src/apis/platformvm"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()

const main = async (): Promise<any> => {
  const txID: string = "7mnY7SqR1s8aTJShjvW1Yebe4snCzsjhonFrrXiWBE4L9x9A6"
  const hex = (await pchain.getTx(txID)) as string
  const buf: Buffer = new Buffer(hex.slice(2), "hex")
  const tx: Tx = new Tx()
  tx.fromBuffer(buf)
  const jsonStr: string = JSON.stringify(tx)
  console.log(jsonStr)
  const jsn: Object = JSON.parse(jsonStr)
  console.log(jsn)
}

main()
