import "dotenv/config"
import { Avalanche } from "../../src"
import { PlatformVMAPI } from "../../src/apis/platformvm"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()

const main = async (): Promise<any> => {
  const txID: string = "x1NLb9JaHkKTXvSRReVSsFwQ38mY7bfD1Ky1BPv721VhrpuSE"
  const includeReason: boolean = true
  const tx: string | object = await pchain.getTxStatus(txID, includeReason)
  console.log(tx)
}

main()
