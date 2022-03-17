import mockAxios from "jest-mock-axios"
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
  SECPTransferOutput,
  TransferableOutput
} from "../../../src/apis/platformvm/outputs"
import { PlatformVMConstants } from "../../../src/apis/platformvm/constants"
import { Avalanche, GenesisData } from "../../../src/index"
import {
  CreateChainTx,
  SubnetAuth,
  PlatformVMAPI,
  UnsignedTx
} from "src/apis/platformvm"
import { UTXOSet } from "src/apis/platformvm"
import { HttpResponse } from "jest-mock-axios/dist/lib/mock-axios-types"
import { Defaults, ONEAVAX } from "src/utils"

describe("CreateChainTx", () => {
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
  const pchain: PlatformVMAPI = avalanche.PChain()
  const pChainBlockchainID: string = "11111111111111111111111111111111LpoYY"
  const genesisDataStr: string =
    "11111DdZMhYXUZiFV9FNpfpTSQroysjHyMuT5zapYkPYrmap7t7S3sDNNwFzngxR9x1XmoRj5JK1XomX8RHvXYY5h3qYeEsMQRF8Ypia7p1CFHDo6KGSjMdiQkrmpvL8AvoezSxVWKXt2ubmBCnSkpPjnQbBSF7gNg4sPu1PXdh1eKgthaSFREqqG5FKMrWNiS6U87kxCmbKjkmBvwnAd6TpNx75YEiS9YKMyHaBZjkRDNf6Nj1"
  const subnetIDStr: string =
    "LtYUqdbbLzTmHMXPPVhAHMeDr6riEmt2pjtfEiqAqAce9MxCg"
  const memoStr: string = "from snowflake to avalanche"
  const blockchainID: string =
    Defaults.network[avalanche.getNetworkID()].P["blockchainID"]
  const memo: Buffer = Buffer.from(memoStr, "utf8")
  const subnetID: Buffer = bintools.cb58Decode(subnetIDStr)
  const chainNameStr: string = "EPIC AVM"
  const vmIDStr: string = "avm"
  const fxIDsStr: string[] = ["nftfx", "propertyfx", "secp256k1fx"]
  const gd: GenesisData = new GenesisData()
  gd.fromBuffer(bintools.cb58Decode(genesisDataStr))
  const addressIndex: Buffer = Buffer.alloc(4)
  addressIndex.writeUIntBE(0x0, 0, 4)
  const subnetAuth: SubnetAuth = new SubnetAuth([addressIndex])
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

  const createChainTx = new CreateChainTx(
    networkID,
    bintools.cb58Decode(pChainBlockchainID),
    outputs,
    inputs,
    memo,
    subnetID,
    chainNameStr,
    vmIDStr,
    fxIDsStr,
    gd,
    subnetAuth
  )
  test("buildCreateChainTx", async (): Promise<void> => {
    const addrs1Strs: string[] = addrs1.map((a): string =>
      bintools.addressToString("local", "P", a)
    )
    const result: Promise<UnsignedTx> = pchain.buildCreateChainTx(
      set,
      addrs1Strs,
      addrs1Strs,
      subnetID,
      chainNameStr,
      vmIDStr,
      fxIDsStr,
      gd,
      subnetAuth,
      memo
    )
    const payload: object = {
      result: {
        assetID: "2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe"
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const txu1: UnsignedTx = await result

    const txu2: UnsignedTx = set.buildCreateChainTx(
      networkID,
      bintools.cb58Decode(blockchainID),
      addrs1,
      addrs1,
      subnetID,
      chainNameStr,
      vmIDStr,
      fxIDsStr,
      gd,
      subnetAuth,
      pchain.getCreateChainTxFee(),
      assetID,
      memo
    )

    expect(txu2.toBuffer().toString("hex")).toBe(
      txu1.toBuffer().toString("hex")
    )
    expect(txu2.toString()).toBe(txu1.toString())

    const tx = txu1.getTransaction() as CreateChainTx
    const txType: number = tx.getTxType()
    expect(txType).toBe(PlatformVMConstants.CREATECHAINTX)

    const sa: SubnetAuth = tx.getSubnetAuth()
    expect(sa).toBe(subnetAuth)

    const sID: string = tx.getSubnetID()
    expect(sID).toBe(subnetIDStr)

    const vID: Buffer = tx.getVMID()
    expect(vID.toString()).toMatch(vmIDStr)

    const cName: string = tx.getChainName()
    expect(cName).toBe(chainNameStr)

    const fIDs: Buffer[] = tx.getFXIDs()
    expect(fIDs.length).toBe(3)
    fIDs.forEach((fxID: Buffer, index: number): void => {
      expect(fxID.toString()).toMatch(fxIDsStr[index])
    })

    const gData: string = tx.getGenesisData()
    expect(gData).toBe(genesisDataStr)
  })
  test("createChainTx getChainName", (): void => {
    const chainName: string = createChainTx.getChainName()
    expect(chainName).toBe(chainNameStr)
  })

  test("createChainTx getTxType", (): void => {
    const txType: number = createChainTx.getTxType()
    expect(txType).toBe(PlatformVMConstants.CREATECHAINTX)
  })
  test("createChainTx getSubnetAuth", (): void => {
    const sa: SubnetAuth = createChainTx.getSubnetAuth()
    expect(sa).toBe(subnetAuth)
  })
  test("createChainTx getSubnetID", (): void => {
    const subnetID: string = createChainTx.getSubnetID()
    expect(subnetID).toBe(subnetIDStr)
  })
  test("createChainTx getVMID", (): void => {
    const vmID: Buffer = createChainTx.getVMID()
    expect(vmID.toString()).toMatch(vmIDStr)
  })
  test("createChainTx getChainName", (): void => {
    const chainName: string = createChainTx.getChainName()
    expect(chainName).toBe(chainNameStr)
  })
  test("createChainTx getFXIDs", (): void => {
    const fxIDs: Buffer[] = createChainTx.getFXIDs()
    expect(fxIDs.length).toBe(3)
    fxIDs.forEach((fxID: Buffer, index: number): void => {
      expect(fxID.toString()).toMatch(fxIDsStr[index])
    })
  })
  test("createChainTx getGenesisData", (): void => {
    const genesisData: string = createChainTx.getGenesisData()
    expect(genesisData).toBe(genesisDataStr)
  })
  test("createChainTx fromBuffer", (): void => {
    const createChainTxBuf: Buffer = createChainTx.toBuffer()
    const createChainTx2: CreateChainTx = new CreateChainTx()
    createChainTx2.fromBuffer(createChainTxBuf)
    expect(createChainTxBuf.toString("hex")).toMatch(
      createChainTx2.toBuffer().toString("hex")
    )
  })
})
