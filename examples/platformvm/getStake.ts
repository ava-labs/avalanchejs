import "dotenv/config"
import { Avalanche } from "../../src"
import { PlatformVMAPI, KeyChain } from "../../src/apis/platformvm"
import { GetStakeResponse } from "../../src/apis/platformvm/interfaces"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey
} from "../../src/utils"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
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
