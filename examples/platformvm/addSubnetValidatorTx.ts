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
  SubnetAuth,
  AddSubnetValidatorTx
} from "../../src/apis/platformvm"
import { Output } from "../../src/common"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  NodeIDStringToBuffer,
  ONEAVAX
} from "../../src/utils"

const bintools: BinTools = BinTools.getInstance()

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()
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
const nodeID: string = "NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg"
const startTime: BN = new BN(1647654984)
const endTime: BN = new BN(1648950865)

const main = async (): Promise<any> => {
  const memoStr: string = "from snowflake to avalanche"
  const memo: Buffer = Buffer.from(memoStr, "utf8")
  const avaxAssetID: Buffer = await pchain.getAVAXAssetID()
  const unlocked: BN = new BN(ONEAVAX.mul(new BN(10000)))
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
  utxos.forEach((utxo: UTXO, index: number): void => {
    const output: Output = utxo.getOutput()
    if (output.getOutputID() === 7 && index === 0) {
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

  const weight: BN = new BN(20)
  const subnetID: Buffer = bintools.cb58Decode(
    "WYziRrZeZVftQ56QizLxmSfwofLyJM8u3uYbRHA1Yc7YtMmbN"
  )
  const addressIndex: Buffer = Buffer.alloc(4)
  addressIndex.writeUIntBE(0x0, 0, 4)
  const subnetAuth: SubnetAuth = new SubnetAuth([addressIndex])
  const blockchainID: Buffer = bintools.cb58Decode(pChainBlockchainID)
  const nodeIDBuf: Buffer = NodeIDStringToBuffer(nodeID)
  const addSubnetValidatorTx: AddSubnetValidatorTx = new AddSubnetValidatorTx(
    networkID,
    blockchainID,
    outputs,
    inputs,
    memo,
    nodeIDBuf,
    startTime,
    endTime,
    weight,
    subnetID,
    subnetAuth
  )
  const unsignedTx: UnsignedTx = new UnsignedTx(addSubnetValidatorTx)
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
