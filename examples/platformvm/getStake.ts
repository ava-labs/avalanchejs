import { Avalanche } from "@c4tplatform/caminojs/dist"
import {
  PlatformVMAPI,
  KeyChain
} from "@c4tplatform/caminojs/dist/apis/platformvm"
import { GetStakeResponse } from "@c4tplatform/caminojs/dist/apis/platformvm/interfaces"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey
} from "@c4tplatform/caminojs/dist/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()
const pKeychain: KeyChain = pchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
pKeychain.importKey(privKey)
const pAddressStrings: string[] = pchain.keyChain().getAddressStrings()
const encoding: string = "hex"

const main = async (): Promise<any> => {
  const getStakeResponse: GetStakeResponse = await pchain.getStake(
    pAddressStrings,
    encoding
  )
  console.log(getStakeResponse)
}

main()
