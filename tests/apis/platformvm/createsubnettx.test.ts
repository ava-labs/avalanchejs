import { UTXO } from "../../../src/apis/platformvm/utxos"
import { KeyChain } from "../../../src/apis/platformvm/keychain"
import {
  SECPTransferInput,
  TransferableInput
} from "../../../src/apis/platformvm/inputs"
import createHash from "create-hash"
import BinTools from "../../../src/utils/bintools"
import BN from "bn.js"
import { Buffer } from "buffer/"
import {
  SECPOwnerOutput,
  SECPTransferOutput,
  TransferableOutput
} from "../../../src/apis/platformvm/outputs"
import { PlatformVMConstants } from "../../../src/apis/platformvm/constants"
import { Avalanche, GenesisData } from "../../../src/index"
import { CreateSubnetTx } from "src/apis/platformvm"
import { UTXOSet } from "src/apis/platformvm"
import { ONEAVAX } from "src/utils"

describe("CreateSubnetTx", (): void => {
  /**
   * @ignore
   */
  const bintools: BinTools = BinTools.getInstance()

  const alias: string = "X"
  const amnt: number = ONEAVAX.toNumber()
  const assetID: Buffer = bintools.cb58Decode(
    "2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe"
  )
  let amount: BN
  let addresses: Buffer[]
  let locktime: BN
  let threshold: number
  const ip: string = "127.0.0.1"
  const port: number = 8080
  const protocol: string = "http"
  const networkID: number = 1337
  const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
  const pChainBlockchainID: string = "11111111111111111111111111111111LpoYY"
  const genesisDataStr: string =
    "11111DdZMhYXUZiFV9FNpfpTSQroysjHyMuT5zapYkPYrmap7t7S3sDNNwFzngxR9x1XmoRj5JK1XomX8RHvXYY5h3qYeEsMQRF8Ypia7p1CFHDo6KGSjMdiQkrmpvL8AvoezSxVWKXt2ubmBCnSkpPjnQbBSF7gNg4sPu1PXdh1eKgthaSFREqqG5FKMrWNiS6U87kxCmbKjkmBvwnAd6TpNx75YEiS9YKMyHaBZjkRDNf6Nj1"
  const memoStr: string = "from snowflake to avalanche"
  const memo: Buffer = Buffer.from(memoStr, "utf8")
  const gd: GenesisData = new GenesisData()
  gd.fromBuffer(bintools.cb58Decode(genesisDataStr))
  const addressIndex: Buffer = Buffer.alloc(4)
  addressIndex.writeUIntBE(0x0, 0, 4)
  let keymgr1: KeyChain = new KeyChain(avalanche.getHRP(), alias)
  let keymgr2: KeyChain = new KeyChain(avalanche.getHRP(), alias)
  let keymgr3: KeyChain = new KeyChain(avalanche.getHRP(), alias)
  let addrs1: Buffer[] = []
  let addrs2: Buffer[] = []
  let addrs3: Buffer[] = []
  let utxos: UTXO[] = []
  let set: UTXOSet = new UTXOSet()
  let inputs: TransferableInput[] = []
  let outputs: TransferableOutput[] = []
  for (let i: number = 0; i < 3; i++) {
    addrs1.push(keymgr1.makeKey().getAddress())
    addrs2.push(keymgr2.makeKey().getAddress())
    addrs3.push(keymgr3.makeKey().getAddress())
  }
  amount = new BN(amnt)
  addresses = keymgr1.getAddresses()
  locktime = new BN(54321)
  threshold = 3

  for (let i: number = 0; i < 5; i++) {
    const bn: BN = new BN(i)
    let length: number = 32
    let txid: Buffer = Buffer.from(
      createHash("sha256").update(bintools.fromBNToBuffer(bn, length)).digest()
    )
    length = 4
    let txidx: Buffer = Buffer.from(bintools.fromBNToBuffer(bn, length))
    const out: SECPTransferOutput = new SECPTransferOutput(
      amount,
      addresses,
      locktime,
      threshold
    )
    const xferout: TransferableOutput = new TransferableOutput(assetID, out)
    outputs.push(xferout)

    const u: UTXO = new UTXO(
      PlatformVMConstants.LATESTCODEC,
      txid,
      txidx,
      assetID,
      out
    )
    utxos.push(u)
    txid = u.getTxID()
    txidx = u.getOutputIdx()

    const input: SECPTransferInput = new SECPTransferInput(amount)
    const xferin: TransferableInput = new TransferableInput(
      txid,
      txidx,
      assetID,
      input
    )
    inputs.push(xferin)
  }
  set.addArray(utxos)

  const bID: Buffer = bintools.cb58Decode(pChainBlockchainID)
  const addys: Buffer[] = []
  const lt: BN = new BN(0)
  const t: number = 1
  const subnetOwners: SECPOwnerOutput = new SECPOwnerOutput(addys, lt, t)

  const createSubnetTx = new CreateSubnetTx(
    networkID,
    bID,
    [],
    [],
    memo,
    subnetOwners
  )
  test("getTypeID", async (): Promise<void> => {
    expect(createSubnetTx.getTypeID()).toBe(PlatformVMConstants.CREATESUBNETTX)
  })
  test("getSubnetOwners", async (): Promise<void> => {
    const subnetOwners: SECPOwnerOutput = createSubnetTx.getSubnetOwners()
    const threshold: number = 1
    const l: BN = subnetOwners.getLocktime()
    const lt: BN = new BN(0)
    expect(l.toNumber()).toBe(lt.toNumber())
    expect(subnetOwners.getThreshold()).toBe(threshold)

    const outputID: number = subnetOwners.getOutputID()
    expect(outputID).toBe(PlatformVMConstants.SECPOWNEROUTPUTID)

    const addresses: Buffer[] = subnetOwners.getAddresses()
    const addrLen: number = 0
    expect(addresses.length).toBe(addrLen)
  })
})
