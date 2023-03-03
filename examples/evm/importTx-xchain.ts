import { Avalanche, BinTools, BN, Buffer } from "caminojs/index"
import {
  AmountOutput,
  EVMAPI,
  EVMOutput,
  ImportTx,
  SECPTransferInput,
  TransferableInput,
  Tx,
  UnsignedTx,
  UTXO,
  UTXOSet
} from "caminojs/apis/evm"
import { DefaultLocalGenesisPrivateKey, PrivateKeyPrefix } from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"
import { AVMAPI } from "caminojs/apis/avm"
import { KeyChain as AVMKeyChain } from "caminojs/apis/avm/keychain"
import { KeyChain as EVMKeyChain } from "caminojs/apis/evm/keychain"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const bintools: BinTools = BinTools.getInstance()
const cHexAddress: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`

const importedIns: TransferableInput[] = []
const evmOutputs: EVMOutput[] = []

let xchain: AVMAPI
let cchain: EVMAPI
let xKeychain: AVMKeyChain
let cKeychain: EVMKeyChain
let xAddresses: Buffer[]
let cAddresses: Buffer[]
let cAddressStrings: string[]
let xChainBlockchainIdStr: string
let xChainBlockchainIdBuf: Buffer
let cChainBlockchainIdStr: string
let cChainBlockchainIdBuf: Buffer
let avaxAssetID: string
let avaxAssetIDBuf: Buffer
let fee: BN

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  xchain = avalanche.XChain()
  cchain = avalanche.CChain()
  xKeychain = xchain.keyChain()
  cKeychain = cchain.keyChain()
  cKeychain.importKey(privKey)
  xAddresses = xchain.keyChain().getAddresses()
  cAddresses = cchain.keyChain().getAddresses()
  cAddressStrings = cchain.keyChain().getAddressStrings()
  xChainBlockchainIdStr = avalanche.getNetwork().X.blockchainID
  xChainBlockchainIdBuf = bintools.cb58Decode(xChainBlockchainIdStr)
  cChainBlockchainIdStr = avalanche.getNetwork().C.blockchainID
  cChainBlockchainIdBuf = bintools.cb58Decode(cChainBlockchainIdStr)
  avaxAssetID = avalanche.getNetwork().X.avaxAssetID
  avaxAssetIDBuf = bintools.cb58Decode(avaxAssetID)
  fee = cchain.getDefaultTxFee()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const u: any = await cchain.getUTXOs(cAddressStrings[0], "X")
  const utxoSet: UTXOSet = u.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO) => {
    const assetID: Buffer = utxo.getAssetID()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()
    const output: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = output.getAmount().clone()
    const input: SECPTransferInput = new SECPTransferInput(amt)
    input.addSignatureIdx(0, cAddresses[0])
    const xferin: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      assetID,
      input
    )
    importedIns.push(xferin)

    const evmOutput: EVMOutput = new EVMOutput(
      cHexAddress,
      amt.sub(fee),
      assetID
    )
    evmOutputs.push(evmOutput)
  })

  const importTx: ImportTx = new ImportTx(
    config.networkID,
    cChainBlockchainIdBuf,
    xChainBlockchainIdBuf,
    importedIns,
    evmOutputs
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(importTx)
  const tx: Tx = unsignedTx.sign(cKeychain)
  const txid: string = await cchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
