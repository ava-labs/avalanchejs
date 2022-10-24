import { Avalanche, BN } from "@c4tplatform/caminojs/dist"
import { EVMAPI } from "@c4tplatform/caminojs/dist/apis/evm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const cchain: EVMAPI = avalanche.CChain()

const main = async (): Promise<any> => {
  const baseFeeResponse: string = await cchain.getBaseFee()
  const baseFee: BN = new BN(parseInt(baseFeeResponse))
  console.log(`BaseFee: ${baseFee.toString()}`)
}

main()
