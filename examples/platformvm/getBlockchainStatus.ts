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
  const blockchainID: string =
    "2AymB4Mb6mErFNsDB8aWb77Ui8oyogXgDyRe9RVQBtqfXzKoUc"
  const blockchainStatus: string = await pchain.getBlockchainStatus(
    blockchainID
  )
  console.log(blockchainStatus)
}

main()
