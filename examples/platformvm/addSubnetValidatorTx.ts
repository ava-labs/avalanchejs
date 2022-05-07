import { Avalanche, BinTools, BN, Buffer } from "../../src"
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
  AddSubnetValidatorTx
} from "../../src/apis/platformvm"
import { Output } from "../../src/common"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  NodeIDStringToBuffer,
  Defaults
} from "../../src/utils"

const bintools: BinTools = BinTools.getInstance()

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()
const pKeychain: KeyChain = pchain.keyChain()
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// 'P-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p',
pKeychain.importKey(privKey)

privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// 'P-custom15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj'
pKeychain.importKey(privKey)

privKey = "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
// 'P-custom1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45',
pKeychain.importKey(privKey)
const pAddresses: Buffer[] = pchain.keyChain().getAddresses()
const pAddressStrings: string[] = pchain.keyChain().getAddressStrings()
const pChainBlockchainID: string = Defaults.network[networkID].P.blockchainID
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = pchain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const nodeID: string = "NodeID-NFBbbJ4qCmNaCzeW7sxErhvWqvEQMnYcN"
const startTime: BN = new BN(1651894150)
const endTime: BN = new BN(1653189723)
const memo: Buffer = Buffer.from("Manually add subnet validator")

const main = async (): Promise<any> => {
  const avaxAssetID: Buffer = await pchain.getAVAXAssetID()
  const getBalanceResponse: any = await pchain.getBalance(pAddressStrings[0])
  const unlocked: BN = new BN(getBalanceResponse.unlocked)
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    unlocked.sub(fee),
    [pAddresses[0]],
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
  utxos.forEach((utxo: UTXO, index: number): void => {
    const output: Output = utxo.getOutput()
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount().clone()
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

  const weight: BN = new BN(20)
  const subnetID: Buffer = bintools.cb58Decode(
    "2aChGx4MubmgrpRqaNjcsN1JnBZ98bUmushPmyP5s1sc1dJz3n"
  )
  const nodeIDBuf: Buffer = NodeIDStringToBuffer(nodeID)
  const addSubnetValidatorTx: AddSubnetValidatorTx = new AddSubnetValidatorTx(
    networkID,
    bintools.cb58Decode(pChainBlockchainID),
    outputs,
    inputs,
    memo,
    nodeIDBuf,
    startTime,
    endTime,
    weight,
    subnetID
  )
  addSubnetValidatorTx.addSignatureIdx(0, pAddresses[0])
  addSubnetValidatorTx.addSignatureIdx(1, pAddresses[1])
  const unsignedTx: UnsignedTx = new UnsignedTx(addSubnetValidatorTx)
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
