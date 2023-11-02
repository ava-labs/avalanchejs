import { Avalanche, Buffer } from "caminojs/index"
import {
  PlatformVMAPI,
  KeyChain,
  UnsignedTx,
  Tx,
  AddressState
} from "caminojs/apis/platformvm"
import { ExamplesConfig } from "../common/examplesConfig"
import { DefaultLocalGenesisPrivateKey2 } from "caminojs/utils"

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
let privKey: string = `PrivateKey-${DefaultLocalGenesisPrivateKey2}`

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddressStrings: string[]

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  // P-kopernikus1g65uqn6t77p656w64023nh8nd9updzmxh8ttv3
  pKeychain.importKey(privKey)

  pAddressStrings = pchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const address = pAddressStrings[0]
  const state = AddressState.OFFERS_CREATOR
  const remove = false
  const memo: Buffer = Buffer.from(
    "Utility function to create an AddressStateTx transaction"
  )

  const unsignedTx: UnsignedTx = await pchain.buildAddressStateTx(
    0,
    undefined,
    pAddressStrings,
    pAddressStrings,
    address,
    state,
    remove,
    memo
  )

  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
