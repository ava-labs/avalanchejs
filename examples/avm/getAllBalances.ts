import { Avalanche } from "@c4tplatform/caminojs/dist"
import { AVMAPI } from "@c4tplatform/caminojs/dist/apis/avm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()

const main = async (): Promise<any> => {
  const address: string = "X-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p"
  const balances: object[] = await xchain.getAllBalances(address)
  console.log(balances)
}

main()
