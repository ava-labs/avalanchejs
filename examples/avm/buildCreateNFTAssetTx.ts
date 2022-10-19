import { Avalanche, BN, Buffer } from "avalanche/dist"
import {
  AVMAPI,
  KeyChain as AVMKeyChain,
  UTXOSet,
  UnsignedTx,
  Tx,
  MinterSet
} from "avalanche/dist/apis/avm"
import { GetUTXOsResponse } from "avalanche/dist/apis/avm/interfaces"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  UnixNow
} from "avalanche/dist/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const xKeychain: AVMKeyChain = xchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = xchain.keyChain().getAddresses()
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
const threshold: number = 1
const locktime: BN = new BN(0)
const asOf: BN = UnixNow()
const memo: Buffer = Buffer.from(
  "AVM utility method buildCreateNFTAssetTx to create an NFT"
)
const name: string = "non fungible token"
const symbol: string = "NFT"

const main = async (): Promise<any> => {
  const avmUTXOResponse: GetUTXOsResponse = await xchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const minterSets: MinterSet[] = [new MinterSet(threshold, xAddresses)]
  const unsignedTx: UnsignedTx = await xchain.buildCreateNFTAssetTx(
    utxoSet,
    xAddressStrings,
    xAddressStrings,
    minterSets,
    name,
    symbol,
    memo,
    asOf,
    locktime
  )

  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await xchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
