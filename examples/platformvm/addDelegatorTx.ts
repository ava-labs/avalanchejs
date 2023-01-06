import { Avalanche, BinTools, BN, Buffer } from "@c4tplatform/caminojs/dist"
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
  AddDelegatorTx,
  Tx,
  SECPOwnerOutput,
  ParseableOutput
} from "@c4tplatform/caminojs/dist/apis/platformvm"
import { BaseOutput } from "@c4tplatform/caminojs/dist/common"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  NodeIDStringToBuffer,
  UnixNow
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
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const stakeOuts: TransferableOutput[] = []
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Manually add a delegator to the primary subnet"
)
const nodeID: string = "NodeID-DueWyGi3B9jtKfa9mPoecd4YSDJ1ftF69"
const startTime: BN = UnixNow().add(new BN(60 * 1))
const endTime: BN = startTime.add(new BN(2630000))

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]
let avaxAssetID: string
let fee: BN
let pChainBlockchainID: string
let avaxAssetIDBuf: Buffer

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  pKeychain.importKey(privKey)
  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
  avaxAssetID = avalanche.getNetwork().X.avaxAssetID
  fee = pchain.getDefaultTxFee()
  pChainBlockchainID = avalanche.getNetwork().P.blockchainID
  avaxAssetIDBuf = bintools.cb58Decode(avaxAssetID)
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const stakeAmount: any = await pchain.getMinStake()
  const avaxAssetID: Buffer = await pchain.getAVAXAssetID()
  const getBalanceResponse: any = await pchain.getBalance({
    address: pAddressStrings[0]
  })
  const unlocked: BN = new BN(getBalanceResponse.unlocked)
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    unlocked.sub(fee).sub(stakeAmount.minValidatorStake),
    pAddresses,
    locktime,
    threshold
  )
  const transferableOutput: TransferableOutput = new TransferableOutput(
    avaxAssetID,
    secpTransferOutput
  )
  outputs.push(transferableOutput)

  const stakeSECPTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    stakeAmount.minValidatorStake,
    pAddresses,
    locktime,
    threshold
  )
  const stakeTransferableOutput: TransferableOutput = new TransferableOutput(
    avaxAssetID,
    stakeSECPTransferOutput
  )
  stakeOuts.push(stakeTransferableOutput)

  const rewardOutputOwners: SECPOwnerOutput = new SECPOwnerOutput(
    pAddresses,
    locktime,
    threshold
  )
  const rewardOwners: ParseableOutput = new ParseableOutput(rewardOutputOwners)

  const platformVMUTXOResponse: any = await pchain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO) => {
    const output: BaseOutput = utxo.getOutput()
    if (output.getOutputID() === 7) {
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
    }
  })

  const addDelegatorTx: AddDelegatorTx = new AddDelegatorTx(
    config.networkID,
    bintools.cb58Decode(pChainBlockchainID),
    outputs,
    inputs,
    memo,
    NodeIDStringToBuffer(nodeID),
    startTime,
    endTime,
    stakeAmount.minDelegatorStake,
    stakeOuts,
    rewardOwners
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(addDelegatorTx)
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
