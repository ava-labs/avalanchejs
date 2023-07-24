import { Avalanche } from "@avalabs/avalanchejs/dist"
import { PlatformVMAPI } from "@avalabs/avalanchejs/dist/apis/platformvm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()

const main = async (): Promise<any> => {
  const blockchains: object[] = await pchain.getBlockchains()
  console.log(blockchains)
}

main()
