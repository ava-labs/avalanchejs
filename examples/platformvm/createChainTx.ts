import {
  Avalanche,
  BinTools,
  BN,
  Buffer,
  GenesisAsset,
  GenesisData
} from "../../src"
import { InitialStates } from "../../src/apis/avm"
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
  SubnetAuth
} from "../../src/apis/platformvm"
import { Output } from "../../src/common"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Serialization,
  ONEAVAX
} from "../../src/utils"

const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

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
const fee: BN = ONEAVAX
const threshold: number = 1
const locktime: BN = new BN(0)

const main = async (): Promise<any> => {
  const assetAlias: string = "AssetAliasTest"
  const name: string = "Test Asset"
  const symbol: string = "TEST"
  const denomination: number = 0
  const amount: BN = new BN(507)
  const vcapSecpOutput = new SECPTransferOutput(
    amount,
    pAddresses,
    locktime,
    threshold
  )
  const initialStates: InitialStates = new InitialStates()
  initialStates.addOutput(vcapSecpOutput)
  const memoStr: string = "from snowflake to avalanche"
  const memo: Buffer = Buffer.from(memoStr, "utf8")
  const genesisAsset = new GenesisAsset(
    assetAlias,
    name,
    symbol,
    denomination,
    initialStates,
    memo
  )
  const genesisAssets: GenesisAsset[] = []
  genesisAssets.push(genesisAsset)
  const genesisData: GenesisData = new GenesisData(genesisAssets, networkID)
  const c: string = serialization.bufferToType(genesisData.toBuffer(), "cb58")

  const avaxAssetID: Buffer = await pchain.getAVAXAssetID()
  const getBalanceResponse: any = await pchain.getBalance(pAddressStrings[0])
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

  const subnetID: Buffer = bintools.cb58Decode(
    "WYziRrZeZVftQ56QizLxmSfwofLyJM8u3uYbRHA1Yc7YtMmbN"
  )
  const chainName: string = "EPIC AVM"
  const vmID: string = "avm"
  const fxIDs: string[] = ["secp256k1fx", "nftfx", "propertyfx"]
  fxIDs.sort()
  const addressIndex: Buffer = Buffer.alloc(4)
  addressIndex.writeUIntBE(0x0, 0, 4)
  const subnetAuth: SubnetAuth = new SubnetAuth([addressIndex])
  const blockchainID: Buffer = bintools.cb58Decode(pChainBlockchainID)
  const createChainTx: CreateChainTx = new CreateChainTx(
    networkID,
    blockchainID,
    outputs,
    inputs,
    memo,
    subnetID,
    chainName,
    vmID,
    fxIDs,
    genesisData,
    subnetAuth
  )
  const unsignedTx: UnsignedTx = new UnsignedTx(createChainTx)
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
