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
  const address: string[] = ["P-avax1tnuesf6cqwnjw7fxjyk7lhch0vhf0v95wj5jvy"]
  const balance: object = await pchain.getBalance(address)
  console.log(balance)
}

main()
