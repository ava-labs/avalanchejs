import { Avalanche, BN, Buffer } from "avalanche/dist"
import {
  AVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "avalanche/dist/apis/avm"
import {
  GetBalanceResponse,
  GetUTXOsResponse
} from "avalanche/dist/apis/avm/interfaces"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  UnixNow
} from "avalanche/dist/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const asOf: BN = UnixNow()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from("AVM utility method buildBaseTx to send AVAX")

var xchain: AVMAPI
var xKeychain: KeyChain
var xAddressStrings: string[]
var avaxAssetID: string
var fee: BN

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  xchain = avalanche.XChain()
  xKeychain = xchain.keyChain()
  xKeychain.importKey(privKey)
  xAddressStrings = xchain.keyChain().getAddressStrings()
  avaxAssetID = avalanche.getNetwork().X.avaxAssetID
  fee = xchain.getDefaultTxFee()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const getBalanceResponse: any = await xchain.getBalance(
    xAddressStrings[0],
    avaxAssetID
  )
  const balance: BN = new BN(getBalanceResponse.balance)
  const avmUTXOResponse: GetUTXOsResponse = await xchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const amount: BN = balance.sub(fee)

  const unsignedTx: UnsignedTx = await xchain.buildBaseTx(
    utxoSet,
    balance.sub(fee).sub(new BN("500000000000")),
    avaxAssetID,
    xAddressStrings,
    xAddressStrings,
    xAddressStrings,
    memo,
    asOf,
    locktime,
    threshold
  )

  console.log(JSON.stringify(unsignedTx))

  const tx: Tx = unsignedTx.sign(xKeychain)
  //const txid: string = await xchain.issueTx(tx)
  //console.log(`Success! TXID: ${txid}`)
}

main()
