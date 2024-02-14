import "dotenv/config"
import createHash from "create-hash"
import { Avalanche, BN, Buffer } from "../../src"
import {
  AVMAPI,
  KeyChain as AVMKeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "../../src/apis/avm"
import {
  KeyChain as PlatformVMKeyChain,
  PlatformVMAPI
} from "../../src/apis/platformvm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults,
  UnixNow,
  SerializedType
} from "../../src/utils"
import { Serialization } from "../../src/utils"

const serialization: Serialization = Serialization.getInstance()
const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
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
const pChainBlockchainID: string = Defaults.network[networkID].P.blockchainID
const avaxAssetID: string = Defaults.network[networkID].X.avaxAssetID
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
