import { Avalanche, BinTools, BN, Buffer } from "caminojs/index"
import { AVMAPI, KeyChain as AVMKeyChain } from "caminojs/apis/avm"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  PlatformVMConstants
} from "caminojs/apis/platformvm"
import {
  MultisigKeyChain,
  MultisigKeyPair,
  OutputOwners
} from "caminojs/common"

import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  DefaultLocalGenesisPrivateKey2,
  PChainAlias
} from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"
import createHash from "create-hash"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const bintools = BinTools.getInstance()
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

const privKey1: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey2}`
const privKey2: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "PlatformVM utility method buildExportTx to export AVAX from the P-Chain to the X-Chain using multisig"
)
const asOf: BN = new BN(0)
const msigAliasArray = [
  "P-kopernikus1z5tv4tg04kf4l9ghclw6ssek8zugs7yd65prpl"
  //"P-kopernikus1t5qgr9hcmf2vxj7k0hz77kawf9yr389cxte5j0"
]

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]
let fee: BN

let xchain: AVMAPI
let xKeychain: AVMKeyChain
let xAddressStrings: string[]
let xChainBlockchainID: string

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  pKeychain.importKey(privKey1)
  pKeychain.importKey(privKey2)
  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
  fee = pchain.getDefaultTxFee()

  xchain = avalanche.XChain()
  xChainBlockchainID = avalanche.getNetwork().X.blockchainID
  xKeychain = xchain.keyChain()
  xKeychain.importKey(privKey1)
  xAddressStrings = xchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  try {
    for (const msigAlias of msigAliasArray) {
      const platformVMUTXOResponse: any = await pchain.getUTXOs([msigAlias])
      const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

      var unsignedTx = await pchain.buildExportTx(
        utxoSet,
        new BN(1000000000),
        xChainBlockchainID,
        xAddressStrings,
        [[msigAlias], pAddressStrings],
        [msigAlias],
        memo,
        asOf,
        locktime,
        threshold
      )

      // UnsignedTx now contains additionally to the sigIdx all OutputOwners
      // which must be fulfilled. This example makes 2 transactions to show
      // the workflow of both variants.

      // Variant 1 -> TX can be fired directly
      var tx = unsignedTx.sign(pKeychain)
      var txid = await pchain.issueTx(tx)
      console.log(`Success! TXID: ${txid}`)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Variant 2 -> Create a multisig keychain and use CaminoCredentials

      // We need to fetch UTXOs again because the previous are not longer valid
      unsignedTx = await pchain.buildExportTx(
        utxoSet,
        new BN(1000000000),
        xChainBlockchainID,
        xAddressStrings,
        [[msigAlias], pAddressStrings],
        [msigAlias],
        memo,
        asOf,
        locktime,
        threshold
      )

      // Create the hash from the tx
      const txbuff = unsignedTx.toBuffer()
      const msg: Buffer = Buffer.from(
        createHash("sha256").update(txbuff).digest()
      )

      // Create the Multisig keychain
      const msigAliasBuffer = pchain.parseAddress(msigAlias)
      const owner = await pchain.getMultisigAlias(msigAlias)

      const msKeyChain = new MultisigKeyChain(
        avalanche.getHRP(),
        PChainAlias,
        msg,
        PlatformVMConstants.SECPMULTISIGCREDENTIAL,
        unsignedTx.getTransaction().getOutputOwners(),
        new Map([
          [
            msigAliasBuffer.toString("hex"),
            new OutputOwners(
              owner.addresses.map((a) => bintools.parseAddress(a, "P")),
              new BN(owner.locktime),
              owner.threshold
            )
          ]
        ])
      )

      for (const address of pAddresses) {
        // We need the keychain for signing
        const keyPair = pKeychain.getKey(address)
        // The signature
        const signature = keyPair.sign(msg)
        msKeyChain.addKey(new MultisigKeyPair(msKeyChain, address, signature))
      }

      // Create signature indices (throws if not able to do so)
      msKeyChain.buildSignatureIndices()

      // Sign the transaction with msig keychain and issue
      tx = unsignedTx.sign(msKeyChain)
      txid = await pchain.issueTx(tx)
      console.log(`Success! TXID: ${txid}`)

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  } catch (e: any) {
    console.log(e)
  }
}
main()
