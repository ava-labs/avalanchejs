import { Avalanche, BinTools, BN, Buffer } from "avalanche/dist"
import {
  PlatformVMAPI,
  KeyChain as PlatformVMKeyChain
} from "avalanche/dist/apis/platformvm"
import {
  EVMAPI,
  KeyChain as EVMKeyChain,
  UnsignedTx,
  Tx,
  EVMInput,
  ExportTx,
  SECPTransferOutput,
  TransferableOutput
} from "avalanche/dist/apis/evm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults,
  ONEAVAX
} from "avalanche/dist/utils"
const Web3 = require("web3")

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()
const cchain: EVMAPI = avalanche.CChain()
const bintools: BinTools = BinTools.getInstance()
const pKeychain: PlatformVMKeyChain = pchain.keyChain()
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// X-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p

// let privKey: string = "PrivateKey-2PvNEohp3sNL41g4XcCBym5hpeT1szSTZXxL7VGS28eoGvq3k7"
const cKeychain: EVMKeyChain = cchain.keyChain()
cKeychain.importKey(privKey)

privKey = "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
// P-custom1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45
pKeychain.importKey(privKey)

// privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// X-custom15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj

privKey = "PrivateKey-rKsiN3X4NSJcPpWxMSh7WcuY653NGQ7tfADgQwDZ9yyUPPDG9"
// P-custom1jwwk62ktygl0w29rsq2hq55amamhpvx82kfnte
pKeychain.importKey(privKey)
const pAddresses: Buffer[] = pchain.keyChain().getAddresses()
const cAddresses: Buffer[] = cchain.keyChain().getAddresses()
const pChainId: string = Defaults.network[networkID].P.blockchainID
const pChainIdBuf: Buffer = bintools.cb58Decode(pChainId)
const cChainId: string = Defaults.network[networkID].C.blockchainID
const cChainIdBuf: Buffer = bintools.cb58Decode(cChainId)
const avaxAssetID: string = Defaults.network[networkID].X.avaxAssetID
const avaxAssetIDBuf: Buffer = bintools.cb58Decode(avaxAssetID)
const cHexAddress: string = "0xeA6B543A9E625C04745EcA3D7a74D74B733b8C15"
const evmInputs: EVMInput[] = []
const exportedOuts: TransferableOutput[] = []
const path: string = "/ext/bc/C/rpc"
const web3 = new Web3(`${protocol}://${ip}:${port}${path}`)
const threshold: number = 2

const main = async (): Promise<any> => {
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
    networkID,
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
