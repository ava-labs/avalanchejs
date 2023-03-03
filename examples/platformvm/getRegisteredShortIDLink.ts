import { Avalanche } from "caminojs/index"
import { KeyChain, PlatformVMAPI } from "caminojs/apis/platformvm"
import { ExamplesConfig } from "../common/examplesConfig"
import { DefaultLocalGenesisPrivateKey, PrivateKeyPrefix } from "caminojs/utils"
import { InfoAPI } from "caminojs/apis/info"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddressStrings: string[]
let info: InfoAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  pKeychain.importKey(privKey)
  pAddressStrings = pchain.keyChain().getAddressStrings()
  info = avalanche.Info()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const resultNodeId: string = await pchain.getRegisteredShortIDLink(
    pAddressStrings[0]
  )
  console.log(resultNodeId)
  const nodeID: string = await info.getNodeID()
  const resultAddress: string = await pchain.getRegisteredShortIDLink(nodeID)
  console.log(resultAddress)
}

main()
