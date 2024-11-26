import {
  AddMemberProposal,
  AddProposalTx,
  KeyChain,
  PlatformVMAPI,
  UnsignedTx
} from "caminojs/apis/platformvm"
import { Avalanche, BinTools, Buffer } from "caminojs/index"
import { DefaultLocalGenesisPrivateKey, PrivateKeyPrefix } from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"
import BN from "bn.js"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
// BEFORE RUNNING THIS EXAMPLE:
// crateUser, importKey to PlatformVM and setAddressState
//You can do this via requests published in camino-postman-collection repository
/**
 * @ignore
 */
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddressStrings: string[]
const targetAddress = "P-kopernikus122gtala73kjrf34xtdq0d9vssqlccxjjam7kk8"
const bintools: BinTools = BinTools.getInstance()
const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  pKeychain.importKey(privKey)

  pAddressStrings = pchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  // TODO: @VjeraTurk get bondAmount from node
  let startDate = new Date()
  startDate.setDate(startDate.getDate() + 1)
  let endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 60)

  let startTimestamp = Math.floor(startDate.getTime() / 1000)
  let endTimestamp = Math.floor(endDate.getTime() / 1000)
  const platformVMUTXOResponse = await pchain.getUTXOs(pAddressStrings)
  const proposal = new AddMemberProposal(
    startTimestamp,
    endTimestamp,
    targetAddress
  )
  try {
    let unsignedTx = await pchain.buildAddProposalTx(
      platformVMUTXOResponse.utxos, // utxoset
      pAddressStrings, // fromAddresses
      pAddressStrings, // changeAddresses
      bintools.stringToBuffer("hello world"), // description
      proposal, // proposal
      pKeychain.getAddresses()[0], // proposerAddress
      0, // version
      Buffer.alloc(20) // memo
    )

    const tx = unsignedTx.sign(pKeychain)
    const hex = tx.toStringHex().slice(2)
    const unsignedTx2 = new UnsignedTx()
    unsignedTx2.fromBuffer(Buffer.from(hex, "hex"))
    const addProposalTx = unsignedTx2.getTransaction() as AddProposalTx
    const addProposalTxTypeName: string = addProposalTx.getTypeName()
    const addProposalTxTypeID: number = addProposalTx.getTypeID()
    const txid: string = await pchain.issueTx(tx)
    console.log(addProposalTxTypeID, addProposalTxTypeName)
    console.log(`Success! TXID: ${txid}`)
  } catch (e) {
    console.log(e)
  }
}

main()
