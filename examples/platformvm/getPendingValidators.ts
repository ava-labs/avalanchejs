import { Avalanche } from "../../src"
import { PlatformVMAPI } from "../../src/apis/platformvm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()

const main = async (): Promise<any> => {
  const subnetID: string = ""
  const nodeIDs: string[] = []
  const pendingValidators: object = await pchain.getPendingValidators()
  console.log(pendingValidators)
}

main()
