import { Avalanche, BN } from "@c4tplatform/caminojs/dist"
import { AVMAPI } from "@c4tplatform/caminojs/dist/apis/avm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()

const main = async (): Promise<any> => {
  const fee: BN = new BN(507)
  xchain.setTxFee(fee)
  const txFee: BN = xchain.getTxFee()
  console.log(txFee)
}

main()
