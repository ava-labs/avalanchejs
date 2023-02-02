import { Avalanche, BinTools, BN, Buffer } from "@c4tplatform/caminojs/dist"
import {
  EVMAPI,
  KeyChain as EVMKeyChain
} from "@c4tplatform/caminojs/dist/apis/evm"
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

const bintools: BinTools = BinTools.getInstance()
// X-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// P-local15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj
const privKey2 = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"

const exportedOuts: TransferableOutput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const threshold: number = 2
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from("Manually Export AVAX from P-Chain to C-Chain")

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]
let avaxAssetID: string
let fee: BN
let pChainBlockchainID: string
let avaxAssetIDBuf: Buffer

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
  avaxAssetIDBuf = bintools.cb58Decode(avaxAssetID)

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
  console.log(unlocked.sub(fee).toString())
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
    const amt: BN = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    secpTransferInput.addSignatureIdx(0, pAddresses[0])
    if (utxo.getOutput().getThreshold() === 2) {
      secpTransferInput.addSignatureIdx(1, pAddresses[1])
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
    bintools.cb58Decode(pChainBlockchainID),
    outputs,
    inputs,
    memo,
    bintools.cb58Decode(cChainBlockchainID),
    exportedOuts
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(exportTx)
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
