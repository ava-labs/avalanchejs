import "dotenv/config"
import { Avalanche } from "../../src"
import { GetRewardUTXOsResponse } from "../../src/apis/platformvm/interfaces"
import { PlatformVMAPI } from "../../src/apis/platformvm"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()

const main = async (): Promise<any> => {
  const txID: string = "2nmH8LithVbdjaXsxVQCQfXtzN9hBbmebrsaEYnLM9T32Uy2Y4"
  const encoding: string = "hex"
  const rewardUTXOs: GetRewardUTXOsResponse = await pchain.getRewardUTXOs(
    txID,
    encoding
  )
  console.log(rewardUTXOs)
}

main()
