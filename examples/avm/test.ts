import { Avalanche, BN, Buffer } from "../../src"
import {
  AVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx,
  InitialStates,
  SECPMintOutput,
  SECPTransferOutput
} from "../../src/apis/avm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const xKeychain: KeyChain = xchain.keyChain()
// const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// xKeychain.importKey(privKey)

const pChainBlockchainID: string = Defaults.network[networkID].P.blockchainID
let privKey: string =
  "PrivateKey-w1AjEVkCQoojAPAq6ZXYYXvW8abWsJD4peUp8s7NF9VUzz5qN"
xKeychain.importKey(privKey)
privKey = "PrivateKey-27CbwYtgDNkMHCLMny4XeDrQwgMPN59pcgQLF2FfL9yMyC4PEi"
xKeychain.importKey(privKey)
privKey = "PrivateKey-yQ8rAtNCtYbCT2NUar6VoqdFBCKDTfk9vBATKtseyKxHmpmig"
xKeychain.importKey(privKey)
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
const xAddresses: Buffer[] = xchain.keyChain().getAddresses()
console.log(xAddresses)
console.log("xAddressStrings", xAddressStrings)

const main = async (): Promise<any> => {
  // const avmUTXOResponse: any = await xchain.getUTXOs(xAddressStrings)

  const avmUTXOResponse: any = await xchain.getUTXOs(
    xAddressStrings,
    pChainBlockchainID
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const addrs: Buffer[] = utxoSet.getAddresses()
  console.log(addrs)

  // let test = await xchain.createAddress(
  //   "test",
  //   "residual-shoji-berg-probe-hoyle-vend-gladiator-fest-rebate"
  // )
  // console.log("test", test)

  //    "X-local1q8ayy4dxap07fvm3k8fydgsac3wt4eh933pmt6",
  //    "X-local15g3k0qsecvat934q0me0fs46vjuhuksgnh8w2q",
  //    "X-local1m08lm9cycewccf3mc6e76dkcnqtgyvse3c5s5g"

  // const amount: BN = new BN("1900000000000000000")
  // const vcapSecpOutput = new SECPTransferOutput(
  //   amount,
  //   xAddresses,
  //   locktime,
  //   threshold
  // )
  // const initialStates: InitialStates = new InitialStates()
  // initialStates.addOutput(vcapSecpOutput)

  // const secpMintOutput: SECPMintOutput = new SECPMintOutput(
  //   xAddresses,
  //   locktime,
  //   threshold
  // )
  // outputs.push(secpMintOutput)

  // const unsignedTx: UnsignedTx = await xchain.buildCreateAssetTx(
  //   utxoSet,
  //   xAddressStrings,
  //   xAddressStrings,
  //   initialStates,
  //   name,
  //   symbol,
  //   denomination,
  //   outputs,
  //   memo
  // )
  // const tx: Tx = unsignedTx.sign(xKeychain)
  // const txid: string = await xchain.issueTx(tx)
  // console.log(`Success! TXID: ${txid}`)
}

main()
