import { Avalanche, BinTools, BN, Buffer } from "avalanche/dist"
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
  BaseTx
} from "avalanche/dist/apis/platformvm"
import { GetBalanceResponse } from "avalanche/dist/apis/avm/interfaces"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults
} from "avalanche/dist/utils"

const bintools: BinTools = BinTools.getInstance()
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const xBlockchainID: string = Defaults.network[networkID].X.blockchainID
const xBlockchainIDBuf: Buffer = bintools.cb58Decode(xBlockchainID)
const avaxAssetID: string = Defaults.network[networkID].X.avaxAssetID
const avaxAssetIDBuf: Buffer = bintools.cb58Decode(avaxAssetID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()
const pKeychain: KeyChain = pchain.keyChain()
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// X-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
pKeychain.importKey(privKey)

privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// X-custom15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj
pKeychain.importKey(privKey)

privKey = "PrivateKey-24b2s6EqkBp9bFG5S3Xxi4bjdxFqeRk56ck7QdQArVbwKkAvxz"
// X-custom1aekly2mwnsz6lswd6u0jqvd9u6yddt5884pyuc
pKeychain.importKey(privKey)
const xAddresses: Buffer[] = pchain.keyChain().getAddresses()
const xAddressStrings: string[] = pchain.keyChain().getAddressStrings()
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = pchain.getDefaultTxFee()
const threshold: number = 3
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "AVM manual create multisig BaseTx to send AVAX"
)
// Uncomment for codecID 00 01
// const codecID: number = 1

const main = async (): Promise<any> => {
  const getBalanceResponse: GetBalanceResponse = await pchain.getBalance(
    xAddressStrings[0]
  )
  const balance: BN = new BN(getBalanceResponse.balance)
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    balance.sub(fee),
    xAddresses,
    locktime,
    threshold
  )
  // Uncomment for codecID 00 01
  //   secpTransferOutput.setCodecID(codecID)
  const transferableOutput: TransferableOutput = new TransferableOutput(
    avaxAssetIDBuf,
    secpTransferOutput
  )
  outputs.push(transferableOutput)

  const avmUTXOResponse: any = await pchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO): void => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    // Uncomment for codecID 00 01
    // secpTransferInput.setCodecID(codecID)
    secpTransferInput.addSignatureIdx(0, xAddresses[0])

    const input: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      avaxAssetIDBuf,
      secpTransferInput
    )
    inputs.push(input)
  })

  const baseTx: BaseTx = new BaseTx(
    networkID,
    xBlockchainIDBuf,
    outputs,
    inputs,
    memo
  )
  // Uncomment for codecID 00 01
  // baseTx.setCodecID(codecID)
  const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}
main()
