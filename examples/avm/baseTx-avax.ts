import createHash from "create-hash"
import { Avalanche, BinTools, BN, Buffer } from "avalanche/dist"
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
  BaseTx
} from "avalanche/dist/apis/avm"
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
const avaxAssetID: string = Defaults.network[networkID].X.avaxAssetID
const avaxAssetIDBuf: Buffer = bintools.cb58Decode(avaxAssetID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const xKeychain: KeyChain = xchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = xchain.keyChain().getAddresses()
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = xchain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from("AVM manual BaseTx to send AVAX")
// Uncomment for codecID 00 01
// const codecID: number = 1

const main = async (): Promise<any> => {
  const getBalanceResponse: any = await xchain.getBalance(
    xAddressStrings[0],
    avaxAssetID
  )
  const balance: BN = new BN(getBalanceResponse.balance)
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    balance.sub(fee),
    xAddresses,
    locktime,
    threshold
  )
  // Uncomment for codecID 00 01
  // secpTransferOutput.setCodecID(codecID)
  const transferableOutput: TransferableOutput = new TransferableOutput(
    avaxAssetIDBuf,
    secpTransferOutput
  )
  outputs.push(transferableOutput)

  const avmUTXOResponse: any = await xchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO) => {
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
    bintools.cb58Decode(xBlockchainID),
    outputs,
    inputs,
    memo
  )
  // Uncomment for codecID 00 01
  // baseTx.setCodecID(codecID)
  const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
  const tx: Tx = unsignedTx.sign(xKeychain)
  const txBuf: Buffer = tx.toBuffer()

  // Start example script for generating the TxID in
  // advance of issuing the tx to a full node

  // Create sha256 hash of the tx buffer
  const sha256Hash: Buffer = Buffer.from(
    createHash("sha256").update(txBuf).digest().buffer
  )

  // cb58 the sha256 hash
  const generatedTxID: string = bintools.cb58Encode(sha256Hash)
  console.log(`Generated TXID: ${generatedTxID}`)

  // End example script for generating the TxID in
  // advance of issuing the tx to a full node

  // get the actual txID from the full node
  const actualTxID: string = await xchain.issueTx(tx)
  console.log(`Success! TXID: ${actualTxID}`)
}

main()
