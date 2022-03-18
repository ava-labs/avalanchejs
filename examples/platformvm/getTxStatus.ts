import { Avalanche } from "../../src"
import { PlatformVMAPI } from "../../src/apis/platformvm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()

const main = async (): Promise<any> => {
  const txID: string = "rykdiLcF2P85bGFHxQWi9Eez2kQ7f14JjJqQfsP5Usni3yaPd"
  const includeReason: boolean = true
  const tx: string | object = await pchain.getTxStatus(txID, includeReason)
  console.log(tx)
}

main()
