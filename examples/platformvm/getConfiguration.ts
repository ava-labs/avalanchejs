import { Avalanche } from "../../src"
import { GetConfigurationResponse } from "../../src/apis/platformvm/interfaces"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)

const main = async (): Promise<any> => {
  await avalanche.fetchNetworkSettings()

  const configurationResponse: GetConfigurationResponse = await avalanche
    .PChain()
    .getConfiguration()
  console.log(configurationResponse)
}

main()
