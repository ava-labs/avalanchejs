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
  ImportTx
} from "caminojs/apis/avm"
import { PrivateKeyPrefix, DefaultLocalGenesisPrivateKey } from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const xchain: AVMAPI = avalanche.XChain()
const bintools: BinTools = BinTools.getInstance()
const xKeychain: KeyChain = xchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = xchain.keyChain().getAddresses()
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
const blockchainID: string = avalanche.getNetwork().X.blockchainID
const avaxAssetID: string = avalanche.getNetwork().X.avaxAssetID
const avaxAssetIDBuf: Buffer = bintools.cb58Decode(avaxAssetID)
const cChainBlockchainID: string = avalanche.getNetwork().C.blockchainID
const importedInputs: TransferableInput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = xchain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Manually Import AVAX and ANT to the X-Chain from the C-Chain"
)
// Uncomment for codecID 00 01
// const codecID: number = 1

const main = async (): Promise<any> => {
  const avmUTXOResponse: any = await xchain.getUTXOs(
    xAddressStrings,
    cChainBlockchainID
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO) => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    let assetID: Buffer = utxo.getAssetID()
    const outputidx: Buffer = utxo.getOutputIdx()
    let secpTransferOutput: SECPTransferOutput = new SECPTransferOutput()
    if (avaxAssetIDBuf.toString("hex") === assetID.toString("hex")) {
      secpTransferOutput = new SECPTransferOutput(
        amt.sub(fee),
        xAddresses,
        locktime,
        threshold
      )
    } else {
      secpTransferOutput = new SECPTransferOutput(
        amt,
        xAddresses,
        locktime,
        threshold
      )
    }
    // Uncomment for codecID 00 01
    // secpTransferOutput.setCodecID(codecID)

    const transferableOutput: TransferableOutput = new TransferableOutput(
      assetID,
      secpTransferOutput
    )
    outputs.push(transferableOutput)

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    secpTransferInput.addSignatureIdx(0, xAddresses[0])
    // Uncomment for codecID 00 01
    // secpTransferInput.setCodecID(codecID)

    const input: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      assetID,
      secpTransferInput
    )
    importedInputs.push(input)
  })

  const importTx: ImportTx = new ImportTx(
    config.networkID,
    bintools.cb58Decode(blockchainID),
    outputs,
    inputs,
    memo,
    bintools.cb58Decode(cChainBlockchainID),
    importedInputs
  )
  // Uncomment for codecID 00 01
  // importTx.setCodecID(codecID)

  const unsignedTx: UnsignedTx = new UnsignedTx(importTx)
  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await xchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
