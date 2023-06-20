import { Avalanche, BinTools, BN, Buffer } from "caminojs/index"
import {
  AmountOutput,
  EVMAPI,
  EVMOutput,
  ImportTx,
  SECPTransferInput,
  TransferableInput,
  Tx,
  UnsignedTx,
  UTXO,
  UTXOSet
} from "caminojs/apis/evm"
import { DefaultLocalGenesisPrivateKey, PrivateKeyPrefix } from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"
import { KeyChain as EVMKeyChain } from "caminojs/apis/evm/keychain"
import { PlatformVMAPI } from "caminojs/apis/platformvm"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const bintools: BinTools = BinTools.getInstance()
const cHexAddress: string = "0xeA6B543A9E625C04745EcA3D7a74D74B733b8C15"
const importedIns: TransferableInput[] = []
const evmOutputs: EVMOutput[] = []

let pchain: PlatformVMAPI
let cchain: EVMAPI
let cKeychain: EVMKeyChain
let cAddresses: Buffer[]
let cAddressStrings: string[]
let cChainId: string
let cChainIdBuf: Buffer
let pChainId: string
let pChainIdBuf: Buffer
let fee: BN

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  cchain = avalanche.CChain()
  cKeychain = cchain.keyChain()
  let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
  // X-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
  cKeychain.importKey(privKey)

  // let privKey: string = "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
  // P-local1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45

  // privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
  // X-local15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj

  privKey = "PrivateKey-rKsiN3X4NSJcPpWxMSh7WcuY653NGQ7tfADgQwDZ9yyUPPDG9"
  // P-local1jwwk62ktygl0w29rsq2hq55amamhpvx82kfnte
  cKeychain.importKey(privKey)
  cAddresses = cchain.keyChain().getAddresses()
  cAddressStrings = cchain.keyChain().getAddressStrings()
  cChainId = avalanche.getNetwork().C.blockchainID
  cChainIdBuf = bintools.cb58Decode(cChainId)
  pChainId = avalanche.getNetwork().P.blockchainID
  pChainIdBuf = bintools.cb58Decode(pChainId)
  fee = cchain.getDefaultTxFee()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const u: any = await cchain.getUTXOs(cAddressStrings, "P")
  const utxoSet: UTXOSet = u.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO): void => {
    const assetID: Buffer = utxo.getAssetID()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()
    const output: AmountOutput = utxo.getOutput() as AmountOutput
    const amount: BN = output.getAmount()
    const input: SECPTransferInput = new SECPTransferInput(amount)
    input.addSignatureIdx(0, cAddresses[1])
    input.addSignatureIdx(1, cAddresses[0])
    const xferin: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      assetID,
      input
    )
    importedIns.push(xferin)

    const evmOutput: EVMOutput = new EVMOutput(
      cHexAddress,
      amount.sub(fee.mul(new BN(3))),
      assetID
    )
    evmOutputs.push(evmOutput)
  })

  const importTx: ImportTx = new ImportTx(
    config.networkID,
    cChainIdBuf,
    pChainIdBuf,
    importedIns,
    evmOutputs
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(importTx)
  const tx: Tx = unsignedTx.sign(cKeychain)
  const txid: string = await cchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
