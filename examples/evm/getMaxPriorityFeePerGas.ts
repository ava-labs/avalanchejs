import { Avalanche, BN } from "avalanche/dist"
import { EVMAPI } from "avalanche/dist/apis/evm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const cchain: EVMAPI = avalanche.CChain()

const main = async (): Promise<any> => {
  const maxPriorityFeePerGas: string = await cchain.getMaxPriorityFeePerGas()
  console.log(maxPriorityFeePerGas)
}

main()
