import { Avalanche, BinTools, BN, Buffer } from "caminojs/index"
import { PlatformVMAPI } from "caminojs/apis/platformvm"
import {
  EVMAPI,
  EVMInput,
  ExportTx,
  KeyChain as EVMKeyChain,
  SECPTransferOutput,
  TransferableOutput,
  Tx,
  UnsignedTx
} from "caminojs/apis/evm"
import {
  DefaultLocalGenesisPrivateKey,
  ONEAVAX,
  PrivateKeyPrefix
} from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"
import { KeyChain as PlatformKeyChain } from "caminojs/apis/platformvm/keychain"

const Web3 = require("web3")

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const bintools: BinTools = BinTools.getInstance()
const cHexAddress: string = "0xeA6B543A9E625C04745EcA3D7a74D74B733b8C15"
const evmInputs: EVMInput[] = []
const exportedOuts: TransferableOutput[] = []
const path: string = "/ext/bc/C/rpc"
const web3 = new Web3(
  `${config.protocol}://${config.host}:${config.port}${path}`
)
const threshold: number = 2

let pchain: PlatformVMAPI
let cchain: EVMAPI
let pKeychain: PlatformKeyChain
let cKeychain: EVMKeyChain
let pAddresses: Buffer[]
let cAddresses: Buffer[]
let pChainIdBuf: Buffer
let cChainIdBuf: Buffer
let avaxAssetID: string
let avaxAssetIDBuf: Buffer
let pChainId: string
let cChainId: string

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  cchain = avalanche.CChain()
  pKeychain = pchain.keyChain()
  cKeychain = cchain.keyChain()
  let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
  // X-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p

  // let privKey: string = "PrivateKey-2PvNEohp3sNL41g4XcCBym5hpeT1szSTZXxL7VGS28eoGvq3k7"
  cKeychain.importKey(privKey)

  privKey = "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
  // P-local1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45
  pKeychain.importKey(privKey)

  // privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
  // X-local15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj

  privKey = "PrivateKey-rKsiN3X4NSJcPpWxMSh7WcuY653NGQ7tfADgQwDZ9yyUPPDG9"
  // P-local1jwwk62ktygl0w29rsq2hq55amamhpvx82kfnte
  pKeychain.importKey(privKey)
  pAddresses = pchain.keyChain().getAddresses()
  cAddresses = cchain.keyChain().getAddresses()
  pChainId = avalanche.getNetwork().P.blockchainID
  cChainId = avalanche.getNetwork().C.blockchainID
  pChainIdBuf = bintools.cb58Decode(pChainId)
  cChainIdBuf = bintools.cb58Decode(cChainId)
  avaxAssetID = avalanche.getNetwork().X.avaxAssetID
  avaxAssetIDBuf = bintools.cb58Decode(avaxAssetID)
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  let balance: BN = await web3.eth.getBalance(cHexAddress)
  balance = new BN(balance.toString().substring(0, 17))
  const fee: BN = cchain.getDefaultTxFee()
  const txcount = await web3.eth.getTransactionCount(cHexAddress)
  const nonce: number = txcount
  const locktime: BN = new BN(0)

  const evmInput: EVMInput = new EVMInput(
    cHexAddress,
    ONEAVAX,
    avaxAssetID,
    nonce
  )
  evmInput.addSignatureIdx(0, cAddresses[0])
  evmInputs.push(evmInput)

  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    ONEAVAX.sub(fee.mul(new BN(2))),
    pAddresses,
    locktime,
    threshold
  )
  const transferableOutput: TransferableOutput = new TransferableOutput(
    avaxAssetIDBuf,
    secpTransferOutput
  )
  exportedOuts.push(transferableOutput)

  const exportTx: ExportTx = new ExportTx(
    config.networkID,
    cChainIdBuf,
    pChainIdBuf,
    evmInputs,
    exportedOuts
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(exportTx)
  const tx: Tx = unsignedTx.sign(cKeychain)
  const txid: string = await cchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
