import "dotenv/config"
import { GetUTXOsResponse } from "../../src/apis/avm/interfaces"
import { Avalanche, BN, Buffer } from "../../src"
import { AVMAPI, KeyChain, UTXOSet, UnsignedTx, Tx } from "../../src/apis/avm"
import { UnixNow } from "../../src/utils"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey
} from "../../src/utils"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const xKeychain: KeyChain = xchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
const asOf: BN = UnixNow()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "AVM utility method buildBaseTx to send an ANT"
)

const main = async (): Promise<any> => {
  const amount: BN = new BN(5)
  const avmUTXOResponse: GetUTXOsResponse = await xchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const assetID: string = "KD4byR998qmVivF2zmrhLb6gjwKGSB5xCerV2nYXb4XNXVGEP"
  const toAddresses: string[] = [xAddressStrings[0]]

  const unsignedTx: UnsignedTx = await xchain.buildBaseTx(
    utxoSet,
    amount,
    assetID,
    toAddresses,
    xAddressStrings,
    xAddressStrings,
    memo,
    asOf,
    locktime,
    threshold
  )

  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await xchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
