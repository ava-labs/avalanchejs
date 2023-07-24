import { Avalanche } from "@avalabs/avalanchejs/dist"
import { GetValidatorsAtResponse } from "@avalabs/avalanchejs/dist/apis/platformvm/interfaces"
import { PlatformVMAPI } from "@avalabs/avalanchejs/dist/apis/platformvm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
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
