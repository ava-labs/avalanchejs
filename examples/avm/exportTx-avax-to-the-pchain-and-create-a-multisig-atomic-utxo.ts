import { Avalanche, BinTools, BN, Buffer } from "caminojs/index"
import {
  AVMAPI,
  KeyChain,
  SECPTransferOutput,
  SECPTransferInput,
  TransferableOutput,
  TransferableInput,
  UTXOSet,
  UTXO,
  AmountOutput,
  UnsignedTx,
  Tx,
  ExportTx
} from "caminojs/apis/avm"
import {
  PlatformVMAPI,
  KeyChain as PlatformVMKeyChain
} from "caminojs/apis/platformvm"
import { PrivateKeyPrefix, DefaultLocalGenesisPrivateKey } from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const bintools: BinTools = BinTools.getInstance()
const exportedOuts: TransferableOutput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const threshold: number = 2
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Export AVAX from the X-Chain to the P-Chain and create a multisig atomic utxo"
)

let xchain: AVMAPI
let pchain: PlatformVMAPI
let xKeychain: KeyChain
let pKeychain: PlatformVMKeyChain
let xAddresses: Buffer[]
let pAddresses: Buffer[]
let xAddressStrings: string[]
let avaxAssetID: string
let fee: BN
let xBlockchainID: string
let pChainBlockchainID: string
let avaxAssetIDBuf: Buffer
let pChainIDBuf: Buffer

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  xchain = avalanche.XChain()
  pchain = avalanche.PChain()
  xKeychain = xchain.keyChain()
  pKeychain = pchain.keyChain()
  let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
  // P-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
  xKeychain.importKey(privKey)
  pKeychain.importKey(privKey)

  privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
  // X-local15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj
  xKeychain.importKey(privKey)
  pKeychain.importKey(privKey)

  privKey = "PrivateKey-rKsiN3X4NSJcPpWxMSh7WcuY653NGQ7tfADgQwDZ9yyUPPDG9"
  // P-local1jwwk62ktygl0w29rsq2hq55amamhpvx82kfnte
  xKeychain.importKey(privKey)
  pKeychain.importKey(privKey)
  xAddresses = xchain.keyChain().getAddresses()
  pAddresses = pchain.keyChain().getAddresses()
  xAddressStrings = xchain.keyChain().getAddressStrings()
  avaxAssetID = avalanche.getNetwork().X.avaxAssetID
  fee = xchain.getDefaultTxFee()
  xBlockchainID = avalanche.getNetwork().X.blockchainID
  pChainBlockchainID = avalanche.getNetwork().P.blockchainID
  avaxAssetIDBuf = bintools.cb58Decode(avaxAssetID)
  pChainIDBuf = bintools.cb58Decode(pChainBlockchainID)
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const getBalanceResponse: any = await xchain.getBalance(
    xAddressStrings[0],
    avaxAssetID
  )
  const balance: BN = new BN(getBalanceResponse.balance)
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    balance.sub(fee),
    pAddresses,
    locktime,
    threshold
  )
  const transferableOutput: TransferableOutput = new TransferableOutput(
    avaxAssetIDBuf,
    secpTransferOutput
  )
  exportedOuts.push(transferableOutput)

  const avmUTXOResponse: any = await xchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO): void => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amount: BN = amountOutput.getAmount().clone()
    const txID: Buffer = utxo.getTxID()
    const outputIdx: Buffer = utxo.getOutputIdx()

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amount)
    secpTransferInput.addSignatureIdx(0, xAddresses[0])

    const input: TransferableInput = new TransferableInput(
      txID,
      outputIdx,
      avaxAssetIDBuf,
      secpTransferInput
    )
    inputs.push(input)
  })

  const exportTx: ExportTx = new ExportTx(
    config.networkID,
    avaxAssetIDBuf,
    outputs,
    inputs,
    memo,
    pChainIDBuf,
    exportedOuts
  )
  const unsignedTx: UnsignedTx = new UnsignedTx(exportTx)
  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await xchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
