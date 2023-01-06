import { Avalanche, Buffer } from "@c4tplatform/caminojs/dist"
import {
  PlatformVMAPI,
  KeyChain,
  UnsignedTx,
  Tx
} from "@c4tplatform/caminojs/dist/apis/platformvm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey
} from "@c4tplatform/caminojs/dist/utils"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

/**
 * @ignore
 */
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  // P-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
  pKeychain.importKey(privKey)
  // NodeID-D1LbWvUf9iaeEyUbTYYtYq4b7GaYR5tnJ (staker2)
  pKeychain.importKey(
    "PrivateKey-2ZW6HUePBW2dP7dBGa5stjXe1uvK9LwEgrjebDwXEyL5bDMWWS"
  )

  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const oldNodeID = undefined
  const newNodeID = "NodeID-D1LbWvUf9iaeEyUbTYYtYq4b7GaYR5tnJ"
  const addr = pAddresses[0]
  const consortiumMemberAuthCredentials: [number, Buffer][] = [
    [0, pAddresses[0]]
  ]
  const memo: Buffer = Buffer.from(
    "Utility function to create a RegisterNodeTx transaction"
  )

  const unsignedTx: UnsignedTx = await pchain.buildRegisterNodeTx(
    pAddressStrings,
    pAddressStrings,
    oldNodeID,
    newNodeID,
    addr,
    consortiumMemberAuthCredentials,
    memo
  )

  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
