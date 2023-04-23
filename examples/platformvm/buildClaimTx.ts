import { Avalanche, BinTools, BN, Buffer } from "caminojs/index"
import {
  PlatformVMAPI,
  KeyChain,
  UnsignedTx,
  UTXOSet,
  Tx,
  ClaimAmountParams,
  ClaimType
} from "caminojs/apis/platformvm"
import { PrivateKeyPrefix, DefaultLocalGenesisPrivateKey } from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"
import { OutputOwners, ZeroBN } from "caminojs/common"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const bintools: BinTools = BinTools.getInstance()
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

/**
 * @ignore
 */
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  // P-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
  pKeychain.importKey(privKey)

  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const platformVMUTXOResponse: any = await pchain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const locked = utxoSet.getLockedTxIDs()

  const memo: Buffer = Buffer.from(
    "Utility function to create a RegisterNodeTx transaction"
  )

  const claimAmounts: ClaimAmountParams = {
    id: bintools.cb58Decode(locked.depositIDs[0]),
    amount: new BN(1),
    claimType: ClaimType.ACTIVE_DEPOSIT_REWARD,
    owners: new OutputOwners(pAddresses, ZeroBN, 1),
    sigIdxs: [0]
  }

  const unsignedTx: UnsignedTx = await pchain.buildClaimTx(
    undefined,
    pAddressStrings,
    pAddressStrings,
    memo,
    undefined,
    1,
    [claimAmounts]
  )

  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
