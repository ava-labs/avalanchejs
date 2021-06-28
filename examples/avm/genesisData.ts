import {
  Avalanche,
  BinTools,
  BN,
  Buffer
} from "../../src"
import {
  AVMAPI,
  KeyChain as AVMKeyChain,
  SECPTransferOutput,
  SECPTransferInput,
  TransferableOutput,
  TransferableInput,
  UTXOSet,
  UTXO,
  AmountOutput,
  UnsignedTx,
  Tx,
  GenesisAsset,
  GenesisData,
  SECPMintOutput,
  InitialStates
} from "../../src/apis/avm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults,
  Serialization
} from "../../src/utils"
const serialization: Serialization = Serialization.getInstance()

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const bintools: BinTools = BinTools.getInstance()
const xKeychain: AVMKeyChain = xchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = xchain.keyChain().getAddresses()
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
const blockchainID: string = "11111111111111111111111111111111LpoYY"
const avaxAssetID: string = Defaults.network[networkID].X.avaxAssetID
const avaxAssetIDBuf: Buffer = bintools.cb58Decode(avaxAssetID)
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = xchain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = serialization.typeToBuffer("2Zc54v4ek37TEwu4LiV3j41PUMRd6acDDU3ZCVSxE7X", "cb58")
const name: string = "asset1"
const symbol: string = "MFCA"
const denomination: number = 1
// Uncomment for codecID 00 01
// const codecID: number = 1

const main = async (): Promise<any> => {
  const getBalanceResponse: any = await xchain.getBalance(xAddressStrings[0], avaxAssetID)
  const balance: BN = new BN(getBalanceResponse.balance)
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(balance.sub(fee), xAddresses, locktime, threshold)
  // Uncomment for codecID 00 01
  // secpTransferOutput.setCodecID(codecID)
  const transferableOutput: TransferableOutput = new TransferableOutput(avaxAssetIDBuf, secpTransferOutput)
  // outputs.push(transferableOutput)

  const avmUTXOResponse: any = await xchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO) => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    // Uncomment for codecID 00 01
    // secpTransferInput.setCodecID(codecID)
    secpTransferInput.addSignatureIdx(0, xAddresses[0])

    const input: TransferableInput = new TransferableInput(txid, outputidx, avaxAssetIDBuf, secpTransferInput)
    // inputs.push(input)
  })

  const amount: BN = new BN(100000)
  const vcapSecpOutput = new SECPTransferOutput(amount, xAddresses, locktime, threshold)
  // Uncomment for codecID 00 01
  // vcapSecpOutput.setCodecID(codecID)
  const secpMintOutput: SECPMintOutput = new SECPMintOutput(xAddresses, locktime, threshold)
  // Uncomment for codecID 00 01
  // secpMintOutput.setCodecID(codecID)

  const initialStates: InitialStates = new InitialStates()
  initialStates.addOutput(vcapSecpOutput)
  // initialStates.addOutput(secpMintOutput)

  const genesisAsset: GenesisAsset = new GenesisAsset(
    memo,
    name,
    symbol,
    denomination,
    initialStates
  )
  const genesisAssets: GenesisAsset[] = [genesisAsset]
  const genesisdata: GenesisData = new GenesisData(networkID, genesisAssets)
  const b: Buffer = genesisdata.toBuffer()
  console.log(b.toString('hex'))
  const cb58: string = serialization.bufferToType(b, "cb58")
  console.log(cb58)
  // console.log(genesisstate)
  // Uncomment for codecID 00 01
  // createAssetTx.setCodecID(codecID)
  // const unsignedTx: UnsignedTx = new UnsignedTx(createAssetTx)
  // const tx: Tx = unsignedTx.sign(xKeychain)
  // const txid: string = await xchain.issueTx(tx)
  // console.log(`Success! TXID: ${txid}`)
}

main()
