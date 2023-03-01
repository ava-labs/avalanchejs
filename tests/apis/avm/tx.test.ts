import mockAxios from "jest-mock-axios"
import { UTXOSet, UTXO } from "../../../src/apis/avm/utxos"
import { AVMAPI } from "../../../src/apis/avm/api"
import { UnsignedTx, Tx } from "../../../src/apis/avm/tx"
import { KeyChain } from "../../../src/apis/avm/keychain"
import {
  SECPTransferInput,
  TransferableInput
} from "../../../src/apis/avm/inputs"
import createHash from "create-hash"
import BinTools from "../../../src/utils/bintools"
import BN from "bn.js"
import { Buffer } from "buffer/"
import {
  SECPTransferOutput,
  NFTTransferOutput,
  TransferableOutput
} from "../../../src/apis/avm/outputs"
import { AVMConstants } from "../../../src/apis/avm/constants"
import {
  TransferableOperation,
  NFTTransferOperation
} from "../../../src/apis/avm/ops"
import { Avalanche } from "../../../src/index"
import { UTF8Payload } from "../../../src/utils/payload"
import { InitialStates } from "../../../src/apis/avm/initialstates"
import { UnixNow } from "../../../src/utils/helperfunctions"
import { BaseTx } from "../../../src/apis/avm/basetx"
import { CreateAssetTx } from "../../../src/apis/avm/createassettx"
import { OperationTx } from "../../../src/apis/avm/operationtx"
import { ImportTx } from "../../../src/apis/avm/importtx"
import { ExportTx } from "../../../src/apis/avm/exporttx"
import {
  DefaultPlatformChainID,
  TestXBlockchainID
} from "../../../src/utils/constants"
import { ONEAVAX } from "../../../src/utils/constants"
import { HttpResponse } from "jest-mock-axios/dist/lib/mock-axios-types"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
describe("Transactions", (): void => {
  let set: UTXOSet
  let keymgr1: KeyChain
  let keymgr2: KeyChain
  let keymgr3: KeyChain
  let addrs1: Buffer[]
  let addrs2: Buffer[]
  let addrs3: Buffer[]
  let utxos: UTXO[]
  let inputs: TransferableInput[]
  let outputs: TransferableOutput[]
  let ops: TransferableOperation[]
  let importIns: TransferableInput[]
  let importUTXOs: UTXO[]
  let exportOuts: TransferableOutput[]
  let fungutxos: UTXO[]
  let exportUTXOIDS: string[]
  let api: AVMAPI
  const amnt: number = 10000
  const netid: number = 12345
  const bID: string = TestXBlockchainID
  const alias: string = "X"
  const assetID: Buffer = Buffer.from(
    createHash("sha256")
      .update(
        "Well, now, don't you tell me to smile, you stick around I'll make it worth your while."
      )
      .digest()
  )
  const NFTassetID: Buffer = Buffer.from(
    createHash("sha256")
      .update(
        "I can't stand it, I know you planned it, I'mma set straight this Watergate.'"
      )
      .digest()
  )
  const codecID_zero: number = 0
  const codecID_one: number = 1
  let amount: BN
  let addresses: Buffer[]
  let fallAddresses: Buffer[]
  let locktime: BN
  let fallLocktime: BN
  let threshold: number
  let fallThreshold: number
  const nftutxoids: string[] = []
  const ip: string = "127.0.0.1"
  const port: number = 8080
  const protocol: string = "http"
  let avalanche: Avalanche
  const blockchainID: Buffer = bintools.cb58Decode(bID)
  const name: string = "Mortycoin is the dumb as a sack of hammers."
  const symbol: string = "morT"
  const denomination: number = 8
  let avaxAssetID: Buffer

  beforeAll(async (): Promise<void> => {
    avalanche = new Avalanche(ip, port, protocol, netid, undefined, undefined)
    api = new AVMAPI(avalanche, "/ext/bc/avm", bID)

    const result: Promise<Buffer> = api.getAVAXAssetID()
    const payload: object = {
      result: {
        name,
        symbol,
        assetID: bintools.cb58Encode(assetID),
        denomination: `${denomination}`
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    avaxAssetID = await result
  })

  beforeEach((): void => {
    set = new UTXOSet()
    keymgr1 = new KeyChain(avalanche.getHRP(), alias)
    keymgr2 = new KeyChain(avalanche.getHRP(), alias)
    keymgr3 = new KeyChain(avalanche.getHRP(), alias)
    addrs1 = []
    addrs2 = []
    addrs3 = []
    utxos = []
    inputs = []
    outputs = []
    importIns = []
    importUTXOs = []
    exportOuts = []
    fungutxos = []
    exportUTXOIDS = []
    ops = []
    for (let i: number = 0; i < 3; i++) {
      addrs1.push(keymgr1.makeKey().getAddress())
      addrs2.push(keymgr2.makeKey().getAddress())
      addrs3.push(keymgr3.makeKey().getAddress())
    }
    amount = ONEAVAX.mul(new BN(amnt))
    addresses = keymgr1.getAddresses()
    fallAddresses = keymgr2.getAddresses()
    locktime = new BN(54321)
    fallLocktime = locktime.add(new BN(50))
    threshold = 3
    fallThreshold = 1

    const payload: Buffer = Buffer.alloc(1024)
    payload.write(
      "All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.",
      0,
      1024,
      "utf8"
    )

    for (let i: number = 0; i < 5; i++) {
      let txid: Buffer = Buffer.from(
        createHash("sha256")
          .update(bintools.fromBNToBuffer(new BN(i), 32))
          .digest()
      )
      let txidx: Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(i), 4))
      const out: SECPTransferOutput = new SECPTransferOutput(
        amount,
        addresses,
        locktime,
        threshold
      )
      const xferout: TransferableOutput = new TransferableOutput(assetID, out)
      outputs.push(xferout)

      const u: UTXO = new UTXO(
        AVMConstants.LATESTCODEC,
        txid,
        txidx,
        assetID,
        out
      )
      utxos.push(u)
      fungutxos.push(u)
      importUTXOs.push(u)

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

      const nout: NFTTransferOutput = new NFTTransferOutput(
        1000 + i,
        payload,
        addresses,
        locktime,
        threshold
      )
      const op: NFTTransferOperation = new NFTTransferOperation(nout)
      const nfttxid: Buffer = Buffer.from(
        createHash("sha256")
          .update(bintools.fromBNToBuffer(new BN(1000 + i), 32))
          .digest()
      )
      const nftutxo: UTXO = new UTXO(
        AVMConstants.LATESTCODEC,
        nfttxid,
        1000 + i,
        NFTassetID,
        nout
      )
      nftutxoids.push(nftutxo.getUTXOID())
      const xferop: TransferableOperation = new TransferableOperation(
        NFTassetID,
        [nftutxo.getUTXOID()],
        op
      )
      ops.push(xferop)
      utxos.push(nftutxo)
    }
    for (let i: number = 1; i < 4; i++) {
      importIns.push(inputs[i])
      exportOuts.push(outputs[i])
      exportUTXOIDS.push(fungutxos[i].getUTXOID())
    }
    set.addArray(utxos)
  })

  test("BaseTx codecIDs", (): void => {
    const baseTx: BaseTx = new BaseTx()
    expect(baseTx.getCodecID()).toBe(codecID_zero)
    expect(baseTx.getTypeID()).toBe(AVMConstants.BASETX)
    baseTx.setCodecID(codecID_one)
    expect(baseTx.getCodecID()).toBe(codecID_one)
    expect(baseTx.getTypeID()).toBe(AVMConstants.BASETX_CODECONE)
    baseTx.setCodecID(codecID_zero)
    expect(baseTx.getCodecID()).toBe(codecID_zero)
    expect(baseTx.getTypeID()).toBe(AVMConstants.BASETX)
  })

  test("Invalid BaseTx codecID", (): void => {
    const baseTx: BaseTx = new BaseTx()
    expect((): void => {
      baseTx.setCodecID(2)
    }).toThrow(
      "Error - BaseTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
    )
  })

  test("CreateAssetTx codecIDs", (): void => {
    const createAssetTx: CreateAssetTx = new CreateAssetTx()
    expect(createAssetTx.getCodecID()).toBe(codecID_zero)
    expect(createAssetTx.getTypeID()).toBe(AVMConstants.CREATEASSETTX)
    createAssetTx.setCodecID(codecID_one)
    expect(createAssetTx.getCodecID()).toBe(codecID_one)
    expect(createAssetTx.getTypeID()).toBe(AVMConstants.CREATEASSETTX_CODECONE)
    createAssetTx.setCodecID(codecID_zero)
    expect(createAssetTx.getCodecID()).toBe(codecID_zero)
    expect(createAssetTx.getTypeID()).toBe(AVMConstants.CREATEASSETTX)
  })

  test("Invalid CreateAssetTx codecID", (): void => {
    const createAssetTx: CreateAssetTx = new CreateAssetTx()
    expect((): void => {
      createAssetTx.setCodecID(2)
    }).toThrow(
      "Error - CreateAssetTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
    )
  })

  test("OperationTx codecIDs", (): void => {
    const operationTx: OperationTx = new OperationTx()
    expect(operationTx.getCodecID()).toBe(codecID_zero)
    expect(operationTx.getTypeID()).toBe(AVMConstants.OPERATIONTX)
    operationTx.setCodecID(codecID_one)
    expect(operationTx.getCodecID()).toBe(codecID_one)
    expect(operationTx.getTypeID()).toBe(AVMConstants.OPERATIONTX_CODECONE)
    operationTx.setCodecID(codecID_zero)
    expect(operationTx.getCodecID()).toBe(codecID_zero)
    expect(operationTx.getTypeID()).toBe(AVMConstants.OPERATIONTX)
  })

  test("Invalid OperationTx codecID", (): void => {
    const operationTx: OperationTx = new OperationTx()
    expect((): void => {
      operationTx.setCodecID(2)
    }).toThrow(
      "Error - OperationTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
    )
  })

  test("ImportTx codecIDs", (): void => {
    const importTx: ImportTx = new ImportTx()
    expect(importTx.getCodecID()).toBe(codecID_zero)
    expect(importTx.getTypeID()).toBe(AVMConstants.IMPORTTX)
    importTx.setCodecID(codecID_one)
    expect(importTx.getCodecID()).toBe(codecID_one)
    expect(importTx.getTypeID()).toBe(AVMConstants.IMPORTTX_CODECONE)
    importTx.setCodecID(codecID_zero)
    expect(importTx.getCodecID()).toBe(codecID_zero)
    expect(importTx.getTypeID()).toBe(AVMConstants.IMPORTTX)
  })

  test("Invalid ImportTx codecID", (): void => {
    const importTx: ImportTx = new ImportTx()
    expect((): void => {
      importTx.setCodecID(2)
    }).toThrow(
      "Error - ImportTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
    )
  })

  test("ExportTx codecIDs", (): void => {
    const exportTx: ExportTx = new ExportTx()
    expect(exportTx.getCodecID()).toBe(codecID_zero)
    expect(exportTx.getTypeID()).toBe(AVMConstants.EXPORTTX)
    exportTx.setCodecID(codecID_one)
    expect(exportTx.getCodecID()).toBe(codecID_one)
    expect(exportTx.getTypeID()).toBe(AVMConstants.EXPORTTX_CODECONE)
    exportTx.setCodecID(codecID_zero)
    expect(exportTx.getCodecID()).toBe(codecID_zero)
    expect(exportTx.getTypeID()).toBe(AVMConstants.EXPORTTX)
  })

  test("Invalid ExportTx codecID", (): void => {
    const exportTx: ExportTx = new ExportTx()
    expect((): void => {
      exportTx.setCodecID(2)
    }).toThrow(
      "Error - ExportTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
    )
  })

  test("Create small BaseTx that is Goose Egg Tx", async (): Promise<void> => {
    const outs: TransferableOutput[] = []
    const ins: TransferableInput[] = []
    const outputAmt: BN = new BN("266")
    const output: SECPTransferOutput = new SECPTransferOutput(
      outputAmt,
      addrs1,
      new BN(0),
      1
    )
    const transferableOutput: TransferableOutput = new TransferableOutput(
      avaxAssetID,
      output
    )
    outs.push(transferableOutput)
    const inputAmt: BN = new BN("400")
    const input: SECPTransferInput = new SECPTransferInput(inputAmt)
    input.addSignatureIdx(0, addrs1[0])
    const txid: Buffer = bintools.cb58Decode(
      "n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL"
    )
    const outputIndex: Buffer = Buffer.from(
      bintools.fromBNToBuffer(new BN(0), 4)
    )
    const transferableInput: TransferableInput = new TransferableInput(
      txid,
      outputIndex,
      avaxAssetID,
      input
    )
    ins.push(transferableInput)
    const baseTx: BaseTx = new BaseTx(netid, blockchainID, outs, ins)
    const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
    expect(await api.checkGooseEgg(unsignedTx)).toBe(true)
  })

  test("Create small BaseTx with bad txid", async (): Promise<void> => {
    const outs: TransferableOutput[] = []
    const outputAmt: BN = new BN("266")
    const output: SECPTransferOutput = new SECPTransferOutput(
      outputAmt,
      addrs1,
      new BN(0),
      1
    )
    const transferableOutput: TransferableOutput = new TransferableOutput(
      avaxAssetID,
      output
    )
    outs.push(transferableOutput)
    const inputAmt: BN = new BN("400")
    const input: SECPTransferInput = new SECPTransferInput(inputAmt)
    input.addSignatureIdx(0, addrs1[0])

    expect((): void => {
      const txid: Buffer = bintools.cb58Decode(
        "n8XHaaaa5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL"
      )
    }).toThrow("Error - BinTools.cb58Decode: invalid checksum")
  })

  test("confirm inputTotal, outputTotal and fee are correct", async (): Promise<void> => {
    // AVAX assetID
    const assetID: Buffer = bintools.cb58Decode(
      "n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL"
    )
    const outs: TransferableOutput[] = []
    const ins: TransferableInput[] = []
    const outputAmt: BN = new BN("266")
    const output: SECPTransferOutput = new SECPTransferOutput(
      outputAmt,
      addrs1,
      new BN(0),
      1
    )
    const transferableOutput: TransferableOutput = new TransferableOutput(
      assetID,
      output
    )
    outs.push(transferableOutput)
    const inputAmt: BN = new BN("400")
    const input: SECPTransferInput = new SECPTransferInput(inputAmt)
    input.addSignatureIdx(0, addrs1[0])
    const txid: Buffer = bintools.cb58Decode(
      "n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL"
    )
    const outputIndex: Buffer = Buffer.from(
      bintools.fromBNToBuffer(new BN(0), 4)
    )
    const transferableInput: TransferableInput = new TransferableInput(
      txid,
      outputIndex,
      assetID,
      input
    )
    ins.push(transferableInput)
    const baseTx: BaseTx = new BaseTx(netid, blockchainID, outs, ins)
    const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
    const inputTotal: BN = unsignedTx.getInputTotal(assetID)
    const outputTotal: BN = unsignedTx.getOutputTotal(assetID)
    const burn: BN = unsignedTx.getBurn(assetID)
    expect(inputTotal.toNumber()).toEqual(new BN(400).toNumber())
    expect(outputTotal.toNumber()).toEqual(new BN(266).toNumber())
    expect(burn.toNumber()).toEqual(new BN(134).toNumber())
  })

  test("Create small BaseTx that isn't Goose Egg Tx", async (): Promise<void> => {
    const outs: TransferableOutput[] = []
    const ins: TransferableInput[] = []
    const outputAmt: BN = new BN("267")
    const output: SECPTransferOutput = new SECPTransferOutput(
      outputAmt,
      addrs1,
      new BN(0),
      1
    )
    const transferableOutput: TransferableOutput = new TransferableOutput(
      avaxAssetID,
      output
    )
    outs.push(transferableOutput)
    const inputAmt: BN = new BN("400")
    const input: SECPTransferInput = new SECPTransferInput(inputAmt)
    input.addSignatureIdx(0, addrs1[0])
    const txid: Buffer = bintools.cb58Decode(
      "n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL"
    )
    const outputIndex: Buffer = Buffer.from(
      bintools.fromBNToBuffer(new BN(0), 4)
    )
    const transferableInput: TransferableInput = new TransferableInput(
      txid,
      outputIndex,
      avaxAssetID,
      input
    )
    ins.push(transferableInput)
    const baseTx: BaseTx = new BaseTx(netid, blockchainID, outs, ins)
    const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
    expect(await api.checkGooseEgg(unsignedTx)).toBe(true)
  })

  test("Create large BaseTx that is Goose Egg Tx", async (): Promise<void> => {
    const outs: TransferableOutput[] = []
    const ins: TransferableInput[] = []
    const outputAmt: BN = new BN("609555500000")
    const output: SECPTransferOutput = new SECPTransferOutput(
      outputAmt,
      addrs1,
      new BN(0),
      1
    )
    const transferableOutput: TransferableOutput = new TransferableOutput(
      avaxAssetID,
      output
    )
    outs.push(transferableOutput)
    const inputAmt: BN = new BN("45000000000000000")
    const input: SECPTransferInput = new SECPTransferInput(inputAmt)
    input.addSignatureIdx(0, addrs1[0])
    const txid: Buffer = bintools.cb58Decode(
      "n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL"
    )
    const outputIndex: Buffer = Buffer.from(
      bintools.fromBNToBuffer(new BN(0), 4)
    )
    const transferableInput: TransferableInput = new TransferableInput(
      txid,
      outputIndex,
      avaxAssetID,
      input
    )
    ins.push(transferableInput)
    const baseTx: BaseTx = new BaseTx(netid, blockchainID, outs, ins)
    const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
    expect(await api.checkGooseEgg(unsignedTx)).toBe(false)
  })

  test("Create large BaseTx that isn't Goose Egg Tx", async (): Promise<void> => {
    const outs: TransferableOutput[] = []
    const ins: TransferableInput[] = []
    const outputAmt: BN = new BN("44995609555500000")
    const output: SECPTransferOutput = new SECPTransferOutput(
      outputAmt,
      addrs1,
      new BN(0),
      1
    )
    const transferableOutput: TransferableOutput = new TransferableOutput(
      avaxAssetID,
      output
    )
    outs.push(transferableOutput)
    const inputAmt: BN = new BN("45000000000000000")
    const input: SECPTransferInput = new SECPTransferInput(inputAmt)
    input.addSignatureIdx(0, addrs1[0])
    const txid: Buffer = bintools.cb58Decode(
      "n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL"
    )
    const outputIndex: Buffer = Buffer.from(
      bintools.fromBNToBuffer(new BN(0), 4)
    )
    const transferableInput: TransferableInput = new TransferableInput(
      txid,
      outputIndex,
      avaxAssetID,
      input
    )
    ins.push(transferableInput)
    const baseTx: BaseTx = new BaseTx(netid, blockchainID, outs, ins)
    const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
    expect(await api.checkGooseEgg(unsignedTx)).toBe(true)
  })

  test("bad asset ID", async (): Promise<void> => {
    expect((): void => {
      const assetID: Buffer = bintools.cb58Decode(
        "badaaaan8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL"
      )
    }).toThrow()
  })

  test("Creation UnsignedTx", (): void => {
    const baseTx: BaseTx = new BaseTx(netid, blockchainID, outputs, inputs)
    const txu: UnsignedTx = new UnsignedTx(baseTx)
    const txins: TransferableInput[] = txu.getTransaction().getIns()
    const txouts: TransferableOutput[] = txu.getTransaction().getOuts()
    expect(txins.length).toBe(inputs.length)
    expect(txouts.length).toBe(outputs.length)

    expect(txu.getTransaction().getTxType()).toBe(0)
    expect(txu.getTransaction().getNetworkID()).toBe(12345)
    expect(txu.getTransaction().getBlockchainID().toString("hex")).toBe(
      blockchainID.toString("hex")
    )

    let a: string[] = []
    let b: string[] = []
    for (let i: number = 0; i < txins.length; i++) {
      a.push(txins[i].toString())
      b.push(inputs[i].toString())
    }
    expect(JSON.stringify(a.sort())).toBe(JSON.stringify(b.sort()))

    a = []
    b = []

    for (let i: number = 0; i < txouts.length; i++) {
      a.push(txouts[i].toString())
      b.push(outputs[i].toString())
    }
    expect(JSON.stringify(a.sort())).toBe(JSON.stringify(b.sort()))

    const txunew: UnsignedTx = new UnsignedTx()
    txunew.fromBuffer(txu.toBuffer())
    expect(txunew.toBuffer().toString("hex")).toBe(
      txu.toBuffer().toString("hex")
    )
    expect(txunew.toString()).toBe(txu.toString())
  })

  test("Creation UnsignedTx Check Amount", (): void => {
    expect((): void => {
      set.buildBaseTx(
        netid,
        blockchainID,
        ONEAVAX.mul(new BN(amnt * 10000)),
        assetID,
        addrs3,
        addrs1,
        addrs1
      )
    }).toThrow()
  })

  test("CreateAssetTX", (): void => {
    const secpbase1: SECPTransferOutput = new SECPTransferOutput(
      new BN(777),
      addrs3,
      locktime,
      1
    )
    const secpbase2: SECPTransferOutput = new SECPTransferOutput(
      new BN(888),
      addrs2,
      locktime,
      1
    )
    const secpbase3: SECPTransferOutput = new SECPTransferOutput(
      new BN(999),
      addrs2,
      locktime,
      1
    )
    const initialState: InitialStates = new InitialStates()
    initialState.addOutput(secpbase1, AVMConstants.SECPFXID)
    initialState.addOutput(secpbase2, AVMConstants.SECPFXID)
    initialState.addOutput(secpbase3, AVMConstants.SECPFXID)
    const name: string = "Rickcoin is the most intelligent coin"
    const symbol: string = "RICK"
    const denomination: number = 9
    const txu: CreateAssetTx = new CreateAssetTx(
      netid,
      blockchainID,
      outputs,
      inputs,
      new UTF8Payload("hello world").getPayload(),
      name,
      symbol,
      denomination,
      initialState
    )
    const txins: TransferableInput[] = txu.getIns()
    const txouts: TransferableOutput[] = txu.getOuts()
    const initState: InitialStates = txu.getInitialStates()
    expect(txins.length).toBe(inputs.length)
    expect(txouts.length).toBe(outputs.length)
    expect(initState.toBuffer().toString("hex")).toBe(
      initialState.toBuffer().toString("hex")
    )

    expect(txu.getTxType()).toBe(AVMConstants.CREATEASSETTX)
    expect(txu.getNetworkID()).toBe(12345)
    expect(txu.getBlockchainID().toString("hex")).toBe(
      blockchainID.toString("hex")
    )

    expect(txu.getName()).toBe(name)
    expect(txu.getSymbol()).toBe(symbol)
    expect(txu.getDenomination()).toBe(denomination)
    expect(txu.getDenominationBuffer().readUInt8(0)).toBe(denomination)

    let a: string[] = []
    let b: string[] = []
    for (let i: number = 0; i < txins.length; i++) {
      a.push(txins[i].toString())
      b.push(inputs[i].toString())
    }
    expect(JSON.stringify(a.sort())).toBe(JSON.stringify(b.sort()))

    a = []
    b = []

    for (let i: number = 0; i < txouts.length; i++) {
      a.push(txouts[i].toString())
      b.push(outputs[i].toString())
    }
    expect(JSON.stringify(a.sort())).toBe(JSON.stringify(b.sort()))

    const txunew: CreateAssetTx = new CreateAssetTx()
    txunew.fromBuffer(txu.toBuffer())
    expect(txunew.toBuffer().toString("hex")).toBe(
      txu.toBuffer().toString("hex")
    )
    expect(txunew.toString()).toBe(txu.toString())
  })

  test("Creation OperationTx", (): void => {
    const optx: OperationTx = new OperationTx(
      netid,
      blockchainID,
      outputs,
      inputs,
      new UTF8Payload("hello world").getPayload(),
      ops
    )
    const txunew: OperationTx = new OperationTx()
    const opbuff: Buffer = optx.toBuffer()
    txunew.fromBuffer(opbuff)
    expect(txunew.toBuffer().toString("hex")).toBe(opbuff.toString("hex"))
    expect(txunew.toString()).toBe(optx.toString())
    expect(optx.getOperations().length).toBe(ops.length)
  })

  test("Creation ImportTx", (): void => {
    const bombtx: ImportTx = new ImportTx(
      netid,
      blockchainID,
      outputs,
      inputs,
      new UTF8Payload("hello world").getPayload(),
      undefined,
      importIns
    )

    expect((): void => {
      bombtx.toBuffer()
    }).toThrow()

    const importTx: ImportTx = new ImportTx(
      netid,
      blockchainID,
      outputs,
      inputs,
      new UTF8Payload("hello world").getPayload(),
      bintools.cb58Decode(DefaultPlatformChainID),
      importIns
    )
    const txunew: ImportTx = new ImportTx()
    const importbuff: Buffer = importTx.toBuffer()
    txunew.fromBuffer(importbuff)

    expect(importTx).toBeInstanceOf(ImportTx)
    expect(importTx.getSourceChain().toString("hex")).toBe(
      bintools.cb58Decode(DefaultPlatformChainID).toString("hex")
    )
    expect(txunew.toBuffer().toString("hex")).toBe(importbuff.toString("hex"))
    expect(txunew.toString()).toBe(importTx.toString())
    expect(importTx.getImportInputs().length).toBe(importIns.length)
  })

  test("Creation ExportTx", (): void => {
    const bombtx: ExportTx = new ExportTx(
      netid,
      blockchainID,
      outputs,
      inputs,
      undefined,
      undefined,
      exportOuts
    )

    expect((): void => {
      bombtx.toBuffer()
    }).toThrow()

    const exportTx: ExportTx = new ExportTx(
      netid,
      blockchainID,
      outputs,
      inputs,
      undefined,
      bintools.cb58Decode(DefaultPlatformChainID),
      exportOuts
    )
    const txunew: ExportTx = new ExportTx()
    const exportbuff: Buffer = exportTx.toBuffer()
    txunew.fromBuffer(exportbuff)

    expect(exportTx).toBeInstanceOf(ExportTx)
    expect(exportTx.getDestinationChain().toString("hex")).toBe(
      bintools.cb58Decode(DefaultPlatformChainID).toString("hex")
    )
    expect(txunew.toBuffer().toString("hex")).toBe(exportbuff.toString("hex"))
    expect(txunew.toString()).toBe(exportTx.toString())
    expect(exportTx.getExportOutputs().length).toBe(exportOuts.length)
  })

  test("Creation Tx1 with asof, locktime, threshold", (): void => {
    const txu: UnsignedTx = set.buildBaseTx(
      netid,
      blockchainID,
      new BN(9000),
      assetID,
      addrs3,
      addrs1,
      addrs1,
      undefined,
      undefined,
      undefined,
      UnixNow(),
      UnixNow().add(new BN(50)),
      1
    )
    const tx: Tx = txu.sign(keymgr1)

    const tx2: Tx = new Tx()
    tx2.fromString(tx.toString())
    expect(tx2.toBuffer().toString("hex")).toBe(tx.toBuffer().toString("hex"))
    expect(tx2.toString()).toBe(tx.toString())
  })
  test("Creation Tx2 without asof, locktime, threshold", (): void => {
    const txu: UnsignedTx = set.buildBaseTx(
      netid,
      blockchainID,
      new BN(9000),
      assetID,
      addrs3,
      addrs1,
      addrs1
    )
    const tx: Tx = txu.sign(keymgr1)
    const tx2: Tx = new Tx()
    tx2.fromBuffer(tx.toBuffer())
    expect(tx2.toBuffer().toString("hex")).toBe(tx.toBuffer().toString("hex"))
    expect(tx2.toString()).toBe(tx.toString())
  })

  test("Creation Tx3 using OperationTx", (): void => {
    const txu: UnsignedTx = set.buildNFTTransferTx(
      netid,
      blockchainID,
      addrs3,
      addrs1,
      addrs2,
      nftutxoids,
      new BN(90),
      avaxAssetID,
      undefined,
      UnixNow(),
      UnixNow().add(new BN(50)),
      1
    )
    const tx: Tx = txu.sign(keymgr1)
    const tx2: Tx = new Tx()
    tx2.fromBuffer(tx.toBuffer())
    expect(tx2.toBuffer().toString("hex")).toBe(tx.toBuffer().toString("hex"))
  })

  test("Creation Tx4 using ImportTx", (): void => {
    const txu: UnsignedTx = set.buildImportTx(
      netid,
      blockchainID,
      addrs3,
      addrs1,
      addrs2,
      importUTXOs,
      bintools.cb58Decode(DefaultPlatformChainID),
      new BN(90),
      assetID,
      new UTF8Payload("hello world").getPayload(),
      UnixNow()
    )
    const tx: Tx = txu.sign(keymgr1)
    const tx2: Tx = new Tx()
    tx2.fromBuffer(tx.toBuffer())
    expect(tx2.toBuffer().toString("hex")).toBe(tx.toBuffer().toString("hex"))
  })

  test("Creation Tx5 using ExportTx", (): void => {
    const txu: UnsignedTx = set.buildExportTx(
      netid,
      blockchainID,
      new BN(90),
      avaxAssetID,
      addrs3,
      addrs1,
      addrs2,
      bintools.cb58Decode(DefaultPlatformChainID),
      undefined,
      undefined,
      new UTF8Payload("hello world").getPayload(),
      UnixNow()
    )
    const tx: Tx = txu.sign(keymgr1)
    const tx2: Tx = new Tx()
    tx2.fromBuffer(tx.toBuffer())
    expect(tx.toBuffer().toString("hex")).toBe(tx2.toBuffer().toString("hex"))
  })
})
