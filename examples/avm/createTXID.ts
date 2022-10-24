import createHash from "create-hash"
import { Avalanche, BN, Buffer } from "@c4tplatform/caminojs/dist"
import {
  AVMAPI,
  KeyChain as AVMKeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "@c4tplatform/caminojs/dist/apis/avm"
import {
  KeyChain as PlatformVMKeyChain,
  PlatformVMAPI
} from "@c4tplatform/caminojs/dist/apis/platformvm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  UnixNow,
  SerializedType
} from "@c4tplatform/caminojs/dist/utils"
import { Serialization } from "@c4tplatform/caminojs/dist/utils"

const serialization: Serialization = Serialization.getInstance()
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const pchain: PlatformVMAPI = avalanche.PChain()
const xKeychain: AVMKeyChain = xchain.keyChain()
const pKeychain: PlatformVMKeyChain = pchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
pKeychain.importKey(privKey)
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
const pAddressStrings: string[] = pchain.keyChain().getAddressStrings()
const pChainBlockchainID: string = avalanche.getNetwork().P.blockchainID
const avaxAssetID: string = avalanche.getNetwork().X.avaxAssetID
const locktime: BN = new BN(0)
const asOf: BN = UnixNow()
const memo: Buffer = Buffer.from(
  "AVM utility method buildExportTx to export AVAX to the P-Chain from the X-Chain"
)
const fee: BN = xchain.getDefaultTxFee()
const cb58: SerializedType = "cb58"

const main = async (): Promise<any> => {
  const avmUTXOResponse: any = await xchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const getBalanceResponse: any = await xchain.getBalance(
    xAddressStrings[0],
    avaxAssetID
  )
  const balance: BN = new BN(getBalanceResponse.balance)
  const amount: BN = balance.sub(fee)

  const unsignedTx: UnsignedTx = await xchain.buildExportTx(
    utxoSet,
    amount,
    pChainBlockchainID,
    pAddressStrings,
    xAddressStrings,
    xAddressStrings,
    memo,
    asOf,
    locktime
  )

  const tx: Tx = unsignedTx.sign(xKeychain)
  const buffer: Buffer = Buffer.from(
    createHash("sha256").update(tx.toBuffer()).digest().buffer
  )
  const txid: string = serialization.bufferToType(buffer, cb58)
  console.log(txid)
  // APfkX9NduHkZtghRpQASNZJjLut4ZAkVhkTGeazQerLSRa36t
}

main()
