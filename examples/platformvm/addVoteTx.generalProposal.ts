import {
  AddVoteTx,
  GeneralProposal,
  KeyChain,
  PlatformVMAPI,
  UnsignedTx
} from "caminojs/apis/platformvm"
import { Avalanche, BinTools, Buffer } from "caminojs/index"
import {
  DefaultLocalGenesisPrivateKey,
  DefaultTransactionVersionNumber,
  PrivateKeyPrefix
} from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"
import { ZeroBN } from "caminojs/common"

const config: ExamplesConfig = require("../common/examplesConfig.json")
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
//TODO: @VjeraTurk add missing example for adding vote to General and Base Fee Proposal
const main = async (): Promise<any> => {
  await InitAvalanche()
  const platformVMUTXOResponse = await pchain.getUTXOs(pAddressStrings)
  const vote = new AddVoteTx()

  const proposal = new GeneralProposal()
  try {
    //let unsignedTx = await pchain.buildAddVoteTx()
    //TODO:  @VjeraTurk add missing example for adding vote to General
    //console.log(unsignedTx)
  } catch (e) {
    console.log(e)
  }
}
//main()
