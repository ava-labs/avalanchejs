import { Avalanche, BinTools, BN, Buffer } from "caminojs/index"
import { AVMAPI, KeyChain as AVMKeyChain } from "caminojs/apis/avm"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "caminojs/apis/platformvm"
import {
  MultisigAliasSet,
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
  "P-kopernikus1fq0jc8svlyazhygkj0s36qnl6s0km0h3uuc99w",
  "P-kopernikus1k4przmfu79ypp4u7y98glmdpzwk0u3sc7saazy"
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
      const unsignedTx: UnsignedTx = await pchain.buildExportTx(
        utxoSet,
        new BN(1000000000),
        xChainBlockchainID,
        xAddressStrings,
        [msigAlias],
        [msigAlias],
        memo,
        asOf,
        locktime,
        threshold
      )

      // Create MultiSig resolver which resolves all aliases
      // If you provide addresses, no wildcard sigIndices are created

      // MultiSigAliasSet
      const msigAliasBuffer = pchain.parseAddress(msigAlias)
      const owner = await pchain.getMultisigAlias(msigAlias)

      var msSet = new MultisigAliasSet(
        new Map([
          [
            msigAliasBuffer.toString("hex"),
            new OutputOwners(
              owner.addresses.map((a) => bintools.parseAddress(a, "P")),
              new BN(owner.locktime),
              owner.threshold
            )
          ]
        ]),
        new Set(pAddresses.map((a) => a.toString("hex")))
      )
      // Note: inplace modifying of input indices
      unsignedTx.getTransaction().resolveMultisigIndices(msSet)

      // Create the hash from the tx
      const txbuff = unsignedTx.toBuffer()
      const msg: Buffer = Buffer.from(
        createHash("sha256").update(txbuff).digest()
      )

      const msKeyChain = new MultisigKeyChain(
        msg,
        avalanche.getHRP(),
        PChainAlias
      )

      for (const address of pAddresses) {
        // We need the keychain for signing
        const keyPair = pKeychain.getKey(address)
        // The signature
        const signature = keyPair.sign(msg)
        msKeyChain.addKey(new MultisigKeyPair(msKeyChain, address, signature))
      }

      // Sign the transaction with msig keychain and issue
      const tx: Tx = unsignedTx.sign(msKeyChain)
      const txid: string = await pchain.issueTx(tx)
      console.log(`Success! TXID: ${txid}`)
    }
  } catch (e: any) {
    console.log(e)
  }
}
main()
