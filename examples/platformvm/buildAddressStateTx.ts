import { Avalanche, Buffer } from "caminojs/index"
import {
  PlatformVMAPI,
  KeyChain,
  UnsignedTx,
  Tx,
  AddressState,
  GetTxStatusResponse
} from "caminojs/apis/platformvm"
import { ExamplesConfig } from "../common/examplesConfig"
import { DefaultLocalGenesisPrivateKey2 } from "caminojs/utils"
import { ZeroBN } from "caminojs/common"


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

  let unsignedTx: UnsignedTx 
  let tx: Tx
  let txid: string
  let status: any

  try{
    unsignedTx = await pchain.buildAddressStateTx(
      0,
      undefined,
      pAddressStrings,
      pAddressStrings,
      address,
      state,
      remove,
      memo
    )

    tx = unsignedTx.sign(pKeychain)
    txid = await pchain.issueTx(tx)
    console.log(`Success! TXID: ${txid}`)

    while ((status = (await pchain.getTxStatus(txid))as GetTxStatusResponse).status !== 'Committed'){
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('Status', status)
  
  } catch(e) {
    console.log('Failed: ', e.message)
  }

  // This should fail because UV1 requires auth
  try {
    unsignedTx = await pchain.buildAddressStateTx(
      1,
      undefined,
      pAddressStrings,
      pAddressStrings,
      address,
      state,
      remove,
      memo
    )

    tx = unsignedTx.sign(pKeychain)
    txid = await pchain.issueTx(tx)
    console.log(`This should not happen: ${txid}`)
  } catch(e) {
    console.log(`Successfully failed!`)
  }

  try {
    unsignedTx = await pchain.buildAddressStateTx(
      1,
      undefined,
      pAddressStrings,
      pAddressStrings,
      address,
      state,
      remove,
      memo,
      ZeroBN,
      1,
      pAddressStrings[0],
      [[0, pAddressStrings[0]]]
    )

    tx = unsignedTx.sign(pKeychain)
    txid = await pchain.issueTx(tx)
    console.log(`Success! TXID: ${txid}`)

    while ((status = (await pchain.getTxStatus(txid))as GetTxStatusResponse).status !== 'Committed'){
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('Status', status)
  } catch(e) {
    console.log('Failed: ', e.message)
  }
}

main()
