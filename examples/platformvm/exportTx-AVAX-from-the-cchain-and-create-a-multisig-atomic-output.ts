import { Avalanche, BinTools, BN, Buffer } from "caminojs/index"
import { EVMAPI, KeyChain as EVMKeyChain } from "caminojs/apis/evm"
import {
  PlatformVMAPI,
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
  ExportTx,
  GetBalanceResponse,
  GetBalanceResponseAvax
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
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// X-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
const privKey2 = "PrivateKey-rKsiN3X4NSJcPpWxMSh7WcuY653NGQ7tfADgQwDZ9yyUPPDG9"
// P-local1jwwk62ktygl0w29rsq2hq55amamhpvx82kfnte

const exportedOuts: TransferableOutput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const threshold: number = 2
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Export AVAX from P-Chain to C-Chain and consume a multisig output and create a multisig atomic output"
)

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]
let avaxAssetID: string
let fee: BN
let pChainBlockchainID: string
let pChainBlockchainIDBuf: Buffer

let cchain: EVMAPI
let cKeychain: EVMKeyChain
let cChainBlockchainID: string
let cChainBlockchainIDBuf: Buffer
let cAddresses: Buffer[]

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  pKeychain.importKey(privKey)
  pKeychain.importKey(privKey2)
  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
  avaxAssetID = avalanche.getNetwork().X.avaxAssetID
  fee = pchain.getDefaultTxFee()
  pChainBlockchainID = avalanche.getNetwork().P.blockchainID
  pChainBlockchainIDBuf = bintools.cb58Decode(pChainBlockchainID)

  cchain = avalanche.CChain()
  cKeychain = cchain.keyChain()
  cKeychain.importKey(privKey)
  cKeychain.importKey(privKey2)
  cAddresses = cchain.keyChain().getAddresses()
  cChainBlockchainID = avalanche.getNetwork().C.blockchainID
  cChainBlockchainIDBuf = bintools.cb58Decode(cChainBlockchainID)
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const avaxAssetID: Buffer = await pchain.getAVAXAssetID()
  const getBalanceResponse: GetBalanceResponse = (await pchain.getBalance({
    address: pAddressStrings[0]
  })) as GetBalanceResponseAvax
  const unlocked: BN = getBalanceResponse.unlocked
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    unlocked.sub(fee),
    cAddresses,
    locktime,
    threshold
  )
  const transferableOutput: TransferableOutput = new TransferableOutput(
    avaxAssetID,
    secpTransferOutput
  )
  exportedOuts.push(transferableOutput)

  const platformVMUTXOResponse: any = await pchain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO): void => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    secpTransferInput.addSignatureIdx(0, pAddresses[1])
    if (utxo.getOutput().getThreshold() === 2) {
      secpTransferInput.addSignatureIdx(1, pAddresses[0])
    }

    const input: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      avaxAssetID,
      secpTransferInput
    )
    inputs.push(input)
  })

  const exportTx: ExportTx = new ExportTx(
    config.networkID,
    pChainBlockchainIDBuf,
    outputs,
    inputs,
    memo,
    cChainBlockchainIDBuf,
    exportedOuts
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(exportTx)
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
