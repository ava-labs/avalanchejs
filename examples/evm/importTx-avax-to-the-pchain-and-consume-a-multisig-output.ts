import "dotenv/config"
import { Avalanche, BinTools, BN, Buffer } from "../../src"
import {
  EVMAPI,
  EVMOutput,
  ImportTx,
  TransferableInput,
  KeyChain,
  UTXO,
  UTXOSet,
  SECPTransferInput,
  AmountOutput,
  UnsignedTx,
  Tx
} from "../../src/apis/evm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults
} from "../../src/utils"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const cchain: EVMAPI = avalanche.CChain()
const bintools: BinTools = BinTools.getInstance()
const cKeychain: KeyChain = cchain.keyChain()
const cHexAddress: string = "0xeA6B543A9E625C04745EcA3D7a74D74B733b8C15"
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// X-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
cKeychain.importKey(privKey)

// let privKey: string = "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
// P-custom1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45

// privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// X-custom15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj

privKey = "PrivateKey-rKsiN3X4NSJcPpWxMSh7WcuY653NGQ7tfADgQwDZ9yyUPPDG9"
// P-custom1jwwk62ktygl0w29rsq2hq55amamhpvx82kfnte
cKeychain.importKey(privKey)
const cAddresses: Buffer[] = cchain.keyChain().getAddresses()
const cAddressStrings: string[] = cchain.keyChain().getAddressStrings()
const cChainId: string = Defaults.network[networkID].C.blockchainID
const cChainIdBuf: Buffer = bintools.cb58Decode(cChainId)
const pChainId: string = Defaults.network[networkID].P.blockchainID
const pChainIdBuf: Buffer = bintools.cb58Decode(pChainId)
const importedIns: TransferableInput[] = []
const evmOutputs: EVMOutput[] = []
const fee: BN = cchain.getDefaultTxFee()

const main = async (): Promise<any> => {
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
    networkID,
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
