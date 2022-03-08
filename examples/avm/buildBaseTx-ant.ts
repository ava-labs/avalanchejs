import { GetUTXOsResponse } from "../../dist/apis/avm/interfaces"
import { Avalanche, BN, Buffer } from "../../dist"
import { AVMAPI, KeyChain, UTXOSet, UnsignedTx, Tx } from "../../dist/apis/avm"
import { UnixNow } from "../../dist/utils"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey
} from "../../dist/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const xBlockchainID: string =
  "qzfF3A11KzpcHkkqznEyQgupQrCNS6WV6fTUTwZpEKqhj1QE7"
const avalanche: Avalanche = new Avalanche(
  ip,
  port,
  protocol,
  networkID,
  xBlockchainID
)
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
  const avmUTXOResponse: GetUTXOsResponse = await xchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const assetID: string = "2VopdncaHrtX1jSbUtSXCeWHSMhqNVF7uENMMR8gfEFanWYsZQ"
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
