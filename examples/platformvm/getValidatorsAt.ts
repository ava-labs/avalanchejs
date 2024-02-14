import "dotenv/config"
import { Avalanche } from "../../src"
import { GetValidatorsAtResponse } from "../../src/apis/platformvm/interfaces"
import { PlatformVMAPI } from "../../src/apis/platformvm"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()

const main = async (): Promise<any> => {
  const height: number = 0
  const subnetID: string = "11111111111111111111111111111111LpoYY"
  const validators: GetValidatorsAtResponse = await pchain.getValidatorsAt(
    height,
    subnetID
  )
  console.log(validators)
}

main()
