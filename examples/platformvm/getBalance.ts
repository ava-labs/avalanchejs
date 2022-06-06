import { Avalanche } from "avalanche/dist"
import { PlatformVMAPI } from "avalanche/dist/apis/platformvm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()

const main = async (): Promise<any> => {
  const address: string = "P-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u00z96u"
  const balance: object = await pchain.getBalance(address)
  console.log(balance)
}

main()
