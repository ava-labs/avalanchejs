import { Avalanche } from "@c4tplatform/caminojs/dist"
import { PlatformVMAPI } from "@c4tplatform/caminojs/dist/apis/platformvm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
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
