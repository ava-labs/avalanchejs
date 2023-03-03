import { Avalanche, BinTools, BN, Buffer } from "caminojs/index"
import {
  AVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx,
  AVMConstants,
  UTXO
} from "caminojs/apis/avm"
import { GetUTXOsResponse } from "caminojs/apis/avm/interfaces"
import { OutputOwners } from "caminojs/common"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  UnixNow
} from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"

// run ts-node examples/avm/buildCreateNFTMintTx.ts
// before you run this example buildCreateNFTAssetTx.ts

const getUTXOIDs = (
  utxoSet: UTXOSet,
  txid: string,
  outputType: number = AVMConstants.SECPXFEROUTPUTID_CODECONE,
  assetID = "2fSX8P4vhGNZsD3WELwwTxx4XzCNwicyFiYbp3Q965BMgJ8g9"
): string[] => {
  const utxoids: string[] = utxoSet.getUTXOIDs()
  let result: string[] = []
  for (let index: number = 0; index < utxoids.length; ++index) {
    if (
      utxoids[index].indexOf(txid.slice(0, 10)) != -1 &&
      utxoSet.getUTXO(utxoids[index]).getOutput().getOutputID() == outputType &&
      assetID ==
        bintools.cb58Encode(utxoSet.getUTXO(utxoids[index]).getAssetID())
    ) {
      result.push(utxoids[index])
    }
  }
  return result
}

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const bintools: BinTools = BinTools.getInstance()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "AVM utility method buildCreateNFTMintTx to mint an ANT"
)
const payload: Buffer = Buffer.from("NFT Payload")
const asOf: BN = UnixNow()

let xchain: AVMAPI
let xKeychain: KeyChain
let xAddresses: Buffer[]
let xAddressStrings: string[]
let avaxAssetID: string
let fee: BN
let xBlockchainID: string
let avaxAssetIDBuf: Buffer

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  xchain = avalanche.XChain()
  xKeychain = xchain.keyChain()
  xKeychain.importKey(privKey)
  xAddresses = xchain.keyChain().getAddresses()
  xAddressStrings = xchain.keyChain().getAddressStrings()
  avaxAssetID = avalanche.getNetwork().X.avaxAssetID
  fee = xchain.getDefaultTxFee()
  xBlockchainID = avalanche.getNetwork().X.blockchainID
  avaxAssetIDBuf = bintools.cb58Decode(avaxAssetID)
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const avmUTXOResponse: GetUTXOsResponse = await xchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const outputOwners: OutputOwners = new OutputOwners(
    xAddresses,
    locktime,
    threshold
  )
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  let txid: Buffer = Buffer.from(
    "2fSX8P4vhGNZsD3WELwwTxx4XzCNwicyFiYbp3Q965BMgJ8g9"
  )
  let assetID: Buffer = Buffer.from(
    "2fSX8P4vhGNZsD3WELwwTxx4XzCNwicyFiYbp3Q965BMgJ8g9"
  )
  utxos.forEach((utxo: UTXO): void => {
    if (utxo.getOutput().getTypeID() === 10) {
      txid = utxo.getTxID()
      assetID = utxo.getAssetID()
    }
  })
  const nftMintOutputUTXOIDs: string[] = getUTXOIDs(
    utxoSet,
    bintools.cb58Encode(txid),
    AVMConstants.NFTMINTOUTPUTID,
    bintools.cb58Encode(assetID)
  )
  const nftMintOutputUTXOID: string = nftMintOutputUTXOIDs[0]
  const groupID: number = 0

  const unsignedTx: UnsignedTx = await xchain.buildCreateNFTMintTx(
    utxoSet,
    outputOwners,
    xAddressStrings,
    xAddressStrings,
    nftMintOutputUTXOID,
    groupID,
    payload,
    memo,
    asOf
  )

  const tx: Tx = unsignedTx.sign(xKeychain)
  const id: string = await xchain.issueTx(tx)
  console.log(`Success! TXID: ${id}`)
}

main()
