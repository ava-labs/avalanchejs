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
  ImportTx
} from "avalanche/dist/apis/platformvm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults
} from "avalanche/dist/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()
const bintools: BinTools = BinTools.getInstance()
const pKeychain: KeyChain = pchain.keyChain()
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// X-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
pKeychain.importKey(privKey)

privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// P-custom15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj
pKeychain.importKey(privKey)

privKey = "PrivateKey-rKsiN3X4NSJcPpWxMSh7WcuY653NGQ7tfADgQwDZ9yyUPPDG9"
// P-custom1jwwk62ktygl0w29rsq2hq55amamhpvx82kfnte
pKeychain.importKey(privKey)
const pAddresses: Buffer[] = pchain.keyChain().getAddresses()
const pAddressStrings: string[] = pchain.keyChain().getAddressStrings()
const xChainID: string = Defaults.network[networkID].X.blockchainID
const xChainIDBuf: Buffer = bintools.cb58Decode(xChainID)
const pChainID: string = Defaults.network[networkID].P.blockchainID
const pChainIDBuf: Buffer = bintools.cb58Decode(pChainID)
const importedInputs: TransferableInput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = pchain.getDefaultTxFee()
const threshold: number = 2
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Import AVAX to P-Chain from X-Chain and consume a multisig atomic output and create a multisig utxo"
)

const main = async (): Promise<any> => {
  const avaxAssetID: Buffer = await pchain.getAVAXAssetID()
  const platformvmUTXOResponse: any = await pchain.getUTXOs(
    pAddressStrings,
    xChainID
  )
  const utxoSet: UTXOSet = platformvmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  let amount: BN = new BN(0)
  utxos.forEach((utxo: UTXO): void => {
    console.log(utxo.getOutput().getAddresses())
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()
    const assetID: Buffer = utxo.getAssetID()

    if (avaxAssetID.toString("hex") === assetID.toString("hex")) {
      const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
      secpTransferInput.addSignatureIdx(1, pAddresses[2])
      secpTransferInput.addSignatureIdx(2, pAddresses[1])
      const input: TransferableInput = new TransferableInput(
        txid,
        outputidx,
        avaxAssetID,
        secpTransferInput
      )
      importedInputs.push(input)
      amount = amount.add(amt)
    }
  })
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    amount.sub(fee),
    pAddresses,
    locktime,
    threshold
  )
  const transferableOutput: TransferableOutput = new TransferableOutput(
    avaxAssetID,
    secpTransferOutput
  )
  outputs.push(transferableOutput)

  const importTx: ImportTx = new ImportTx(
    networkID,
    pChainIDBuf,
    outputs,
    inputs,
    memo,
    xChainIDBuf,
    importedInputs
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(importTx)
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
