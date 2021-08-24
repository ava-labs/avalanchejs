import { Avalanche, BN, Buffer } from "../../src"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "../../src/apis/platformvm"
import {
  CurrentValidatorsResponse,
  ValidatorInterface
} from "../../src/apis/platformvm/interfaces"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  UnixNow
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()
const pKeychain: KeyChain = pchain.keyChain()
// let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// pKeychain.importKey(privKey)
let privKey = "PrivateKey-2VUiWfD8hYjE8qompMZTL4KTJ59UifY1Gi1rkT5fZUTY6z4F97"
pKeychain.importKey(privKey)
const pAddressStrings: string[] = pchain.keyChain().getAddressStrings()
console.log(pAddressStrings)
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "PlatformVM utility method buildAddDelegatorTx to add a delegator to the primary subnet"
)
const asOf: BN = UnixNow()
const changeThreshold: number = 2

const main = async (): Promise<any> => {
  const currentValidators =
    (await pchain.getCurrentValidators()) as CurrentValidatorsResponse
  const validator: ValidatorInterface = currentValidators.validators[0]
  // console.log(validator.delegators[0])
  const stakeAmount: any = await pchain.getMinStake()
  // console.log(stakeAmount)

  const nodeID: string = validator.nodeID
  const startTime: BN = UnixNow().add(new BN(60 * 1))
  const endTime: BN = new BN(validator.endTime).sub(new BN(1))
  const platformVMUTXOResponse: any = await pchain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  console.log(utxoSet.getAllUTXOs())

  const unsignedTx: UnsignedTx = await pchain.buildAddDelegatorTx(
    utxoSet,
    pAddressStrings,
    pAddressStrings,
    pAddressStrings,
    nodeID,
    startTime,
    endTime,
    stakeAmount.minDelegatorStake,
    pAddressStrings,
    locktime,
    threshold,
    memo,
    asOf,
    changeThreshold
  )

  const tx: Tx = unsignedTx.sign(pKeychain)
  console.log(tx.getUnsignedTx().getTransaction().getOuts()[0].getOutput())
  // return false
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
