import { Avalanche, BinTools, BN, Buffer } from "avalanche/dist"
import { EVMAPI, KeyChain as EVMKeyChain } from "avalanche/dist/apis/evm"
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
  ExportTx
} from "avalanche/dist/apis/platformvm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults,
  MILLIAVAX
} from "avalanche/dist/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const cchain: EVMAPI = avalanche.CChain()
const pchain: PlatformVMAPI = avalanche.PChain()
const bintools: BinTools = BinTools.getInstance()
const cKeychain: EVMKeyChain = cchain.keyChain()
const pKeychain: KeyChain = pchain.keyChain()
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// X-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
cKeychain.importKey(privKey)
pKeychain.importKey(privKey)

// let privKey: string = "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
// P-custom1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45

// privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// P-custom15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj

privKey = "PrivateKey-rKsiN3X4NSJcPpWxMSh7WcuY653NGQ7tfADgQwDZ9yyUPPDG9"
// P-custom1jwwk62ktygl0w29rsq2hq55amamhpvx82kfnte
cKeychain.importKey(privKey)
pKeychain.importKey(privKey)
const cAddresses: Buffer[] = cchain.keyChain().getAddresses()
const pAddresses: Buffer[] = pchain.keyChain().getAddresses()
const pAddressStrings: string[] = pchain.keyChain().getAddressStrings()
const cChainID: string = Defaults.network[networkID].C.blockchainID
const cChainIDBuf: Buffer = bintools.cb58Decode(cChainID)
const pChainID: string = Defaults.network[networkID].P.blockchainID
const pChainIDBuf: Buffer = bintools.cb58Decode(pChainID)
const exportedOuts: TransferableOutput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = MILLIAVAX
const threshold: number = 2
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Export AVAX from P-Chain to C-Chain and consume a multisig output and create a multisig atomic output"
)

const main = async (): Promise<any> => {
  const avaxAssetID: Buffer = await pchain.getAVAXAssetID()
  const getBalanceResponse: any = await pchain.getBalance(pAddressStrings[0])
  const unlocked: BN = new BN(getBalanceResponse.unlocked)
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    unlocked.sub(fee),
    cAddresses,
    locktime,
    threshold
  )
  const transferableOutput: TransferableOutput = new TransferableOutput(
    avaxAssetID,
    secpTransferOutput
  )
  exportedOuts.push(transferableOutput)

  const platformVMUTXOResponse: any = await pchain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO): void => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    secpTransferInput.addSignatureIdx(0, pAddresses[1])
    if (utxo.getOutput().getThreshold() === 2) {
      secpTransferInput.addSignatureIdx(1, pAddresses[0])
    }

    const input: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      avaxAssetID,
      secpTransferInput
    )
    inputs.push(input)
  })

  const exportTx: ExportTx = new ExportTx(
    networkID,
    pChainIDBuf,
    outputs,
    inputs,
    memo,
    cChainIDBuf,
    exportedOuts
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(exportTx)
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
