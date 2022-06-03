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
  CreateSubnetTx,
  Tx,
  SECPOwnerOutput
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
// Keychain with 4 keys-A, B, C, and D
const pKeychain: KeyChain = pchain.keyChain()
// Keypair A
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// P-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
pKeychain.importKey(privKey)

// Keypair B
privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// P-custom15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj
pKeychain.importKey(privKey)

// Keypair C
privKey = "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
// P-custom1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45
pKeychain.importKey(privKey)

// Keypair D
privKey = "PrivateKey-2uWuEQbY5t7NPzgqzDrXSgGPhi3uyKj2FeAvPUHYo6CmENHJfn"
// P-custom1t3qjau2pf3ys83yallqt4y5xc3l6ya5f7wr6aq
pKeychain.importKey(privKey)
const pAddresses: Buffer[] = pchain.keyChain().getAddresses()
const pAddressStrings: string[] = pchain.keyChain().getAddressStrings()
const pChainBlockchainID: string = Defaults.network[networkID].P.blockchainID
const pChainBlockchainIDBuf: Buffer = bintools.cb58Decode(pChainBlockchainID)
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = pchain.getCreateSubnetTxFee()
const threshold: number = 1
const threshold2: number = 2
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Manually create a CreateSubnetTx which creates a 1-of-2 AVAX utxo and a 2-of-3 SubnetAuth"
)
const avaxUTXOKeychain: Buffer[] = [pAddresses[0], pAddresses[1]]
const subnetAuthKeychain: Buffer[] = [
  pAddresses[1],
  pAddresses[2],
  pAddresses[3]
]

const main = async (): Promise<any> => {
  const avaxAssetID: Buffer = await pchain.getAVAXAssetID()
  const getBalanceResponse: any = await pchain.getBalance(pAddressStrings[0])
  const unlocked: BN = new BN(getBalanceResponse.unlocked)
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
    const amountOutput = utxo.getOutput() as AmountOutput
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

  const subnetOwner: SECPOwnerOutput = new SECPOwnerOutput(
    subnetAuthKeychain,
    locktime,
    threshold2
  )
  const createSubnetTx: CreateSubnetTx = new CreateSubnetTx(
    networkID,
    pChainBlockchainIDBuf,
    outputs,
    inputs,
    memo,
    subnetOwner
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(createSubnetTx)
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
