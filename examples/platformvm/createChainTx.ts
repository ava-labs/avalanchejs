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
  CreateChainTx,
  Tx,
  SECPOwnerOutput
} from "../../src/apis/platformvm"
import { Output } from "../../src/common"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 61300
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()
const bintools: BinTools = BinTools.getInstance()
const pKeychain: KeyChain = pchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
pKeychain.importKey(privKey)
const pAddresses: Buffer[] = pchain.keyChain().getAddresses()
const pAddressStrings: string[] = pchain.keyChain().getAddressStrings()
const pChainBlockchainID: string = "11111111111111111111111111111111LpoYY"
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = pchain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from("Manually create a blockchain")

const main = async (): Promise<any> => {
  const avaxAssetID: Buffer = await pchain.getAVAXAssetID()
  const getBalanceResponse: any = await pchain.getBalance(pAddressStrings[0])
  console.log(getBalanceResponse)
  const unlocked: BN = new BN(getBalanceResponse.unlocked)
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    unlocked.sub(fee),
    pAddresses,
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
  utxos.forEach((utxo: UTXO) => {
    const output: Output = utxo.getOutput()
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

  const subnetOwner: SECPOwnerOutput = new SECPOwnerOutput(
    pAddresses,
    locktime,
    threshold
  )
  const subnetID: Buffer = bintools.cb58Decode(
    "24tZhrm8j8GCJRE9PomW8FaeqbgGS4UAQjJnqqn8pq5NwYSYV1"
  )
  const chainName: string = "My new avm 4"
  const vmID: string = "avm"
  const fxIDs: Buffer[] = []
  const genesisData: Buffer = bintools.cb58Decode(
    "111115LHK2ZCYttSKPmmhsTDSuKiCkmHz65nUS1YqybvjirwGLLt376k1RwnTt72WobPqrG7rmgrKVqSq6VxDsKXYGnRmfhdLCEhsYjMegZmu5L5wEQ6k1BHu1QN6jk8kfoLQfAnKAxv8t5PmGJUwmTyoHz9aoDpfwJfkzjLut3TSSHzVLzH5bPoc5fYMwKGA1Zaps4Byo6rPpAZgiDG1jokzLuVXFDMxiFSDGHHA7uB5Nx2qaywtUXtyTi7JMYMKQMcB2UQEZbpPB9QcHg88mA8uzT2i5YYSiT9uZpAUjd6cfNiPedBJqi5AdjtcAmHvhszCS7YurbVmB4sHEP3PMxyKAHMnQ8dyxefQCDPUpSGMFp6qzomuXQSQeTi"
  )
  const createChainTx: CreateChainTx = new CreateChainTx(
    networkID,
    bintools.cb58Decode(pChainBlockchainID),
    outputs,
    inputs,
    memo,
    subnetID,
    chainName,
    vmID,
    fxIDs,
    genesisData
  )
  console.log(createChainTx)

  // const unsignedTx: UnsignedTx = new UnsignedTx(createChainTx)
  // const tx: Tx = unsignedTx.sign(pKeychain)
  // const txid: string = await pchain.issueTx(tx)
  // console.log(`Success! TXID: ${txid}`)
}

main()
