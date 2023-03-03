import { Avalanche, BN, Buffer } from "caminojs/index"
import { AVMAPI, KeyChain as AVMKeyChain } from "caminojs/apis/avm"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "caminojs/apis/platformvm"
import {
  MultiSigAliasSet,
  MultiSigKeyChain,
  MultiSigKeyPair,
  OutputOwners
} from "caminojs/common"

import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey2,
  PChainAlias
} from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"
import createHash from "create-hash"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey2}`
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "PlatformVM utility method buildExportTx to export AVAX from the P-Chain to the X-Chain using multisig"
)
const asOf: BN = new BN(0)
const msigAlias = "P-kopernikus1fq0jc8svlyazhygkj0s36qnl6s0km0h3uuc99w"

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
  pKeychain.importKey(privKey)
  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
  fee = pchain.getDefaultTxFee()

  xchain = avalanche.XChain()
  xChainBlockchainID = avalanche.getNetwork().X.blockchainID
  xKeychain = xchain.keyChain()
  xKeychain.importKey(privKey)
  xAddressStrings = xchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  try {
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
    // We need the keychain for signing
    const keyPair = pKeychain.getKey(pAddresses[0])

    /**
     * We assume that only ins UTXOs are selected which are owned by this msig alias.
     * If there would be combinations / nesting, we would have to adjust sigIndices
     */

    // Create the hash from the tx
    const txbuff = unsignedTx.toBuffer()
    const msg: Buffer = Buffer.from(
      createHash("sha256").update(txbuff).digest()
    )
    // The signature
    const signature = keyPair.sign(msg)

    // MultiSigKeyChain
    const msigAliasBuffer = pchain.parseAddress(msigAlias)
    var msSet: MultiSigAliasSet = new Map([
      [msigAliasBuffer.toString(), new OutputOwners(pAddresses, undefined, 1)]
    ])

    const msKeyChain = new MultiSigKeyChain(
      msSet,
      msg,
      avalanche.getHRP(),
      PChainAlias
    )
    msKeyChain.addKey(new MultiSigKeyPair(msKeyChain, pAddresses[0], signature))

    const tx: Tx = unsignedTx.sign(msKeyChain)
    const txid: string = await pchain.issueTx(tx)
    console.log(`Success! TXID: ${txid}`)
  } catch (e: any) {
    console.log(e)
  }
}

main()
