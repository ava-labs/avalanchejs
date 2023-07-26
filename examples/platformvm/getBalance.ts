import { Avalanche } from "../../src"
import { PlatformVMAPI } from "../../src/apis/platformvm"

const ip: string = "api.avax.network"
const port: number = 443
const protocol: string = "https"
const networkID: number = 5
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()

const main = async (): Promise<any> => {
  const address: string[] = ["P-avax1tnuesf6cqwnjw7fxjyk7lhch0vhf0v95wj5jvy"]
  const balance: object = await pchain.getBalance(address)
  console.log(balance)
}

main()
