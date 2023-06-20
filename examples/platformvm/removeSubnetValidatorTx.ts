import { Avalanche, BinTools, BN, Buffer } from "caminojs/index"
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
  RemoveSubnetValidatorTx,
  GetBalanceResponse,
  GetBalanceResponseAvax
} from "caminojs/apis/platformvm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  NodeIDStringToBuffer
} from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

const bintools: BinTools = BinTools.getInstance()
// Keypair A
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const threshold: number = 1
const locktime: BN = new BN(0)
const nodeID: string = "NodeID-NFBbbJ4qCmNaCzeW7sxErhvWqvEQMnYcN"
const memo: Buffer = Buffer.from(
  "Manually create a removeSubnetValidatorTx which creates a 1-of-2 AVAX utxo and removes a validator from a subnet by correctly signing the 2-of-3 SubnetAuth"
)

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]
let avaxAssetID: string
let fee: BN
let pChainBlockchainID: string
let pChainBlockchainIDBuf: Buffer
let avaxAssetIDBuf: Buffer
let avaxUTXOKeychain: Buffer[]

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  // P-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
  pKeychain.importKey(privKey)
  // P-local15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj
  pKeychain.importKey(
    "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
  )
  // P-local1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45
  pKeychain.importKey(
    "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
  )
  // P-local1t3qjau2pf3ys83yallqt4y5xc3l6ya5f7wr6aq
  pKeychain.importKey(
    "PrivateKey-2uWuEQbY5t7NPzgqzDrXSgGPhi3uyKj2FeAvPUHYo6CmENHJfn"
  )
  pAddresses = pchain.keyChain().getAddresses()
  avaxUTXOKeychain = [pAddresses[0], pAddresses[1]]
  pAddressStrings = pchain.keyChain().getAddressStrings()
  avaxAssetID = avalanche.getNetwork().X.avaxAssetID
  fee = pchain.getDefaultTxFee()
  pChainBlockchainID = avalanche.getNetwork().P.blockchainID
  pChainBlockchainIDBuf = bintools.cb58Decode(pChainBlockchainID)
  avaxAssetIDBuf = bintools.cb58Decode(avaxAssetID)
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const avaxAssetID: Buffer = await pchain.getAVAXAssetID()
  const getBalanceResponse: GetBalanceResponse = (await pchain.getBalance([
    pAddressStrings[0]
  ])) as GetBalanceResponseAvax
  const unlocked: BN = getBalanceResponse.unlocked
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    unlocked.sub(fee),
    avaxUTXOKeychain,
    locktime,
    threshold
  )
  const transferableOutput: TransferableOutput = new TransferableOutput(
    avaxAssetID,
    secpTransferOutput
  )
  outputs.push(transferableOutput)

  const platformVMUTXOResponse: any = await pchain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO): void => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    secpTransferInput.addSignatureIdx(0, pAddresses[0])

    const input: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      avaxAssetID,
      secpTransferInput
    )
    inputs.push(input)
  })

  const subnetID: Buffer = bintools.cb58Decode(
    "8T4oUrP7kXzetGF2bYWF21oJHUT18rJCjfBt3J299hA1Smcqa"
  )
  const nodeIDBuf: Buffer = NodeIDStringToBuffer(nodeID)
  const removeSubnetValidatorTx: RemoveSubnetValidatorTx =
    new RemoveSubnetValidatorTx(
      config.networkID,
      pChainBlockchainIDBuf,
      outputs,
      inputs,
      memo,
      nodeIDBuf,
      subnetID
    )
  removeSubnetValidatorTx.addSignatureIdx(0, pAddresses[3])
  removeSubnetValidatorTx.addSignatureIdx(1, pAddresses[1])
  const unsignedTx: UnsignedTx = new UnsignedTx(removeSubnetValidatorTx)
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
