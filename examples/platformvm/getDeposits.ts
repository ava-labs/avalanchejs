import { Avalanche } from "caminojs/index"
import {
  GetUTXOsResponse,
  KeyChain,
  PlatformVMAPI,
  UTXOSet
} from "caminojs/apis/platformvm"
import { ExamplesConfig } from "../common/examplesConfig"
import { DefaultLocalGenesisPrivateKey, PrivateKeyPrefix } from "caminojs/utils"

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

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  pKeychain.importKey(privKey)
  pAddressStrings = pchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const platformVMUTXOResponse: GetUTXOsResponse = await pchain.getUTXOs(
    pAddressStrings
  )
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const txIDs = utxoSet.getLockedTxIDs()

  const deposits = await pchain.getDeposits(txIDs.depositIDs)
  console.log(deposits)
}

main()
