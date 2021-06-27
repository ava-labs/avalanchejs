import BN from 'bn.js'
import { Buffer } from 'buffer/'
import { BaseTx, CreateAssetTx, ExportTx, ImportTx, InitialStates, MinterSet, NFTCredential, NFTMintOperation, NFTMintOutput, NFTTransferOperation, NFTTransferOutput, OperationTx, SECPCredential, SECPMintOperation, SECPMintOutput, SECPTransferInput, SECPTransferOutput, TransferableInput, TransferableOperation, TransferableOutput, UTXOID } from 'src/apis/avm'
import { Address, Serialized, Signature } from 'src/common'
import { Defaults, Serialization, SerializedEncoding, SerializedType } from '../../src/utils'
import { getPreferredHRP } from '../../src/utils'

const serialization: Serialization = Serialization.getInstance()

describe("Serialization", (): void => {
  const address: string = "X-avax1wst8jt3z3fm9ce0z6akj3266zmgccdp03hjlaj"
  const nodeID: string = "NodeID-MFrZFVCXPv5iCn6M9K6XduxGTYp891xXZ"
  const privateKey: string = "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
  const cb58: string = "2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed"
  const base64: string = "ZnJvbSBzbm93Zmxha2UgdG8gQXZhbGFuY2hl"
  const hex: string = "66726f6d20736e6f77666c616b6520746f204176616c616e636865"
  const decimalString: string = "12345"
  const num: number = 12345
  const utf8: string = "from snowflake to Avalanche"
  const bn: BN = new BN(9000)
  const name: string = "BaseTx"
  const denomination: Buffer = Buffer.alloc(1)
  const chainID: string = "X"
  const hrp: any = getPreferredHRP(1)

  test("instance of", (): void => {
    expect(serialization).toBeInstanceOf(Serialization)
  })

  describe("typeToBuffer && bufferToType", (): void => {
    let t: SerializedType
    let buf: Buffer
    test("BN", (): void => {
      t = "BN"
      const bn: BN = new BN(9000)
      buf = serialization.typeToBuffer(bn, t)
      const b: BN = serialization.bufferToType(buf, t)
      expect(bn.toString()).toEqual(b.toString())
    })

    test("bech32", (): void => {
      t = "bech32"
      buf = serialization.typeToBuffer(address, t)
      const bech32: string = serialization.bufferToType(buf, t, hrp, chainID)
      expect(bech32).toEqual(address)
    })

    test("nodeID", (): void => {
      t = "nodeID"
      buf = serialization.typeToBuffer(nodeID, t)
      const n: string = serialization.bufferToType(buf, t)
      expect(nodeID).toEqual(n)
    })

    test("privateKey", (): void => {
      t = "privateKey"
      buf = serialization.typeToBuffer(privateKey, t)
      const p: string = serialization.bufferToType(buf, t)
      expect(privateKey).toEqual(p)
    })

    test("cb58", (): void => {
      t = "cb58"
      buf = serialization.typeToBuffer(cb58, t)
      const c: string = serialization.bufferToType(buf, t)
      expect(cb58).toEqual(c)
    })

    test("base58", (): void => {
      t = "cb58"
      buf = serialization.typeToBuffer(cb58, t)
      const c: string = serialization.bufferToType(buf, t)
      expect(cb58).toEqual(c)
    })

    test("base64", (): void => {
      t = "base64"
      buf = serialization.typeToBuffer(base64, t)
      const b64: string = serialization.bufferToType(buf, t)
      expect(base64).toEqual(b64)
    })

    test("hex", (): void => {
      t = "hex"
      buf = serialization.typeToBuffer(hex, t)
      const h: string = serialization.bufferToType(buf, t)
      expect(hex).toEqual(h)
    })

    test("decimalString", (): void => {
      t = "decimalString"
      buf = serialization.typeToBuffer(decimalString, t)
      const d: string = serialization.bufferToType(buf, t)
      expect(decimalString).toEqual(d)
    })

    test("number", (): void => {
      t = "number"
      buf = serialization.typeToBuffer(num, t)
      const nu: string = serialization.bufferToType(buf, t)
      expect(num).toEqual(nu)
    })

    test("utf8", (): void => {
      t = "utf8"
      buf = serialization.typeToBuffer(utf8, t)
      const u: string = serialization.bufferToType(buf, t)
      expect(utf8).toEqual(u)
    })
  })

  describe("encoder && decoder", (): void => {
    const encoding: SerializedEncoding = "hex"
    test("BN", (): void => {
      const str: string = serialization.encoder(bn, encoding, "BN", "BN")
      const decoded: string = serialization.decoder(str, encoding, "BN", "BN")
      expect(bn.toString()).toEqual(decoded.toString())
    })

    test("bech32", (): void => {
      const str: string = serialization.encoder(address, encoding, "bech32", "bech32")
      const decoded: string = serialization.decoder(str, encoding, "bech32", "bech32", hrp, chainID)
      expect(address).toEqual(decoded)
    })

    test("nodeID", (): void => {
      const str: string = serialization.encoder(nodeID, encoding, "nodeID", "nodeID")
      const decoded: string = serialization.decoder(str, encoding, "nodeID", "nodeID")
      expect(nodeID).toEqual(decoded)
    })

    test("privateKey", (): void => {
      const str: string = serialization.encoder(privateKey, encoding, "privateKey", "privateKey")
      const decoded: string = serialization.decoder(str, encoding, "privateKey", "privateKey")
      expect(privateKey).toEqual(decoded)
    })

    test("cb58", (): void => {
      const str: string = serialization.encoder(cb58, encoding, "cb58", "cb58")
      const decoded: string = serialization.decoder(str, encoding, "cb58", "cb58")
      expect(cb58).toEqual(decoded)
    })

    test("base58", (): void => {
      const str: string = serialization.encoder(cb58, encoding, "base58", "base58")
      const decoded: string = serialization.decoder(str, encoding, "base58", "base58")
      expect(cb58).toEqual(decoded)
    })

    test("base64", (): void => {
      const str: string = serialization.encoder(base64, encoding, "base64", "base64")
      const decoded: string = serialization.decoder(str, encoding, "base64", "base64")
      expect(base64).toEqual(decoded)
    })

    test("hex", (): void => {
      const str: string = serialization.encoder(hex, encoding, "hex", "hex")
      const decoded: string = serialization.decoder(str, encoding, "hex", "hex")
      expect(hex).toEqual(decoded)
    })

    test("utf8", (): void => {
      const str: string = serialization.encoder(name, encoding, "utf8", "utf8")
      const decoded: string = serialization.decoder(str, encoding, "utf8", "utf8")
      expect(name).toBe(decoded)
    })

    test("decimalString", (): void => {
      const str: string = serialization.encoder(decimalString, encoding, "decimalString", "decimalString")
      const decoded: string = serialization.decoder(str, encoding, "decimalString", "decimalString")
      expect(decimalString).toBe(decoded)
    })

    test("number", (): void => {
      const str: string = serialization.encoder(num, encoding, "number", "number")
      const decoded: string = serialization.decoder(str, encoding, "number", "number")
      expect(num).toBe(decoded)
    })

    test("Buffer", (): void => {
      const str: string = serialization.encoder(denomination, encoding, "Buffer", "decimalString", 1)
      const decoded: Buffer = serialization.decoder(str, encoding, "decimalString", "Buffer", 1)
      expect(denomination.toString('hex')).toBe(decoded.toString('hex'))
    })
  })

  describe("serialize && deserialize", (): void => {
    const networkid: number = 12345
    const m: string = "2Zc54v4ek37TEwu4LiV3j41PUMRd6acDDU3ZCVSxE7X"
    const mHex: string = "66726f6d20736e6f77666c616b6520746f206176616c616e636865"
    const memo: Buffer = serialization.typeToBuffer(m, "cb58")
    const cChainID: string = "2CA6j5zYzasynPsFeNoqWkmTCt3VScMvXUZHbfDJ8k3oGzAPtU"
    const cChainIDHex: string = "9d0775f450604bd2fbc49ce0c5c1c6dfeb2dc2acb8c92c26eeae6e6df4502b19"
    const hex: SerializedEncoding = "hex"
    const cb58: SerializedEncoding = "cb58"
    const amountHex: string = "0000000000000000"
    const bytes: string = '0000000000000000000000000000000000000000'
    const xAddress: string = "X-avax1pdurs53v6vtue9sw7am9ayjqh9mcnqe9s80sgn"
    const xAddressHex: string = '0b7838522cd317cc960ef7765e9240b977898325'
    const threshold: number = 1
    const thresholdHex: string = '00000001'
    const minters: string[] = [xAddress]
    const assetid: Buffer = serialization.typeToBuffer(cChainID, "cb58")
    const assetidHex: string = "9d0775f450604bd2fbc49ce0c5c1c6dfeb2dc2acb8c92c26eeae6e6df4502b19"
    const payload: Buffer = Buffer.from("From snowflake to Avalanche")
    const groupIDHex: string = "00003039"
    const payloadHex: string = "46726f6d20736e6f77666c616b6520746f204176616c616e636865"
    const locktimeHex: string = '0000000000000000'

    describe("AVM", (): void => {
      const type: SerializedType = "cb58"
      const blockchainIDCB58: Buffer = serialization.typeToBuffer(Defaults.network[12345]["X"].blockchainID, type)
      const blockchainIDHex: string = "d891ad56056d9c01f18f43f58b5c784ad07a4a49cf3d1f11623804b5cba2c6bf"
      const networkIDHex: string = "00003039"
      const outs: TransferableOutput[] = []
      const ins: TransferableInput[] = []
      const vm: string = "AVM"
      const groupID: number = 12345

      test("BaseTx", (): void => {
        const basetx: BaseTx = new BaseTx(networkid, blockchainIDCB58, outs, ins, memo)
        const notes: string = "AVM BaseTx"
        const serialized: Serialized = serialization.serialize(basetx, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("BaseTx")
        expect(serialized.fields["_typeID"]).toBe(0)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["blockchainid"]).toBe(blockchainIDHex)
        expect(serialized.fields["networkid"]).toBe(networkIDHex)
        expect(serialized.fields["outs"].length).toBe(0)
        expect(serialized.fields["ins"].length).toBe(0)
        expect(serialized.fields["memo"]).toBe(mHex)
      })

      test("CreateAssetTx", (): void => {
        const name: string = "Test Token"
        const nameHex: string = '5465737420546f6b656e'
        const symbol: string = "TEST"
        const symbolHex: string = '54455354'
        const denomination: number = 1
        const denominationHex: string = '01'
        const initialstate: InitialStates = new InitialStates()
        const createassettx: CreateAssetTx = new CreateAssetTx(networkid, blockchainIDCB58, outs, ins, memo, name, symbol, denomination, initialstate)
        const notes: string = "AVM CreateAssetTx"
        const serialized: Serialized = serialization.serialize(createassettx, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("CreateAssetTx")
        expect(serialized.fields["_typeID"]).toBe(1)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["blockchainid"]).toBe(blockchainIDHex)
        expect(serialized.fields["networkid"]).toBe(networkIDHex)
        expect(serialized.fields["outs"].length).toBe(0)
        expect(serialized.fields["ins"].length).toBe(0)
        expect(serialized.fields["memo"]).toBe(mHex)
        expect(serialized.fields["name"]).toBe(nameHex)
        expect(serialized.fields["symbol"]).toBe(symbolHex)
        expect(serialized.fields["denomination"]).toBe(denominationHex)
      })

      test("OperationTx", (): void => {
        const ops: TransferableOperation[] = []
        const operationtx: OperationTx = new OperationTx(networkid, blockchainIDCB58, outs, ins, memo, ops)
        const notes: string = "AVM OperationTx"
        const serialized: Serialized = serialization.serialize(operationtx, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("OperationTx")
        expect(serialized.fields["_typeID"]).toBe(2)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["blockchainid"]).toBe(blockchainIDHex)
        expect(serialized.fields["networkid"]).toBe(networkIDHex)
        expect(serialized.fields["outs"].length).toBe(0)
        expect(serialized.fields["ins"].length).toBe(0)
        expect(serialized.fields["memo"]).toBe(mHex)
        expect(serialized.fields["ops"].length).toBe(0)
      })

      test("ImportTx", (): void => {
        const sourceChain: Buffer = serialization.typeToBuffer(cChainID, cb58)
        const importIns: TransferableInput[] = []
        const importtx: ImportTx = new ImportTx(networkid, blockchainIDCB58, outs, ins, memo, sourceChain, importIns)
        const notes: string = "AVM ImportTx"
        const serialized: Serialized = serialization.serialize(importtx, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("ImportTx")
        expect(serialized.fields["_typeID"]).toBe(3)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["blockchainid"]).toBe(blockchainIDHex)
        expect(serialized.fields["networkid"]).toBe(networkIDHex)
        expect(serialized.fields["outs"].length).toBe(0)
        expect(serialized.fields["ins"].length).toBe(0)
        expect(serialized.fields["memo"]).toBe(mHex)
        expect(serialized.fields["sourceChain"]).toBe(cChainIDHex)
        expect(serialized.fields["importIns"].length).toBe(0)
      })

      test("ExportTx", (): void => {
        const destinationChain: Buffer = serialization.typeToBuffer(cChainID, cb58)
        const exportOuts: TransferableOutput[] = []
        const exporttx: ExportTx = new ExportTx(networkid, blockchainIDCB58, outs, ins, memo, destinationChain, exportOuts)
        const notes: string = "AVM ExportTx"
        const serialized: Serialized = serialization.serialize(exporttx, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("ExportTx")
        expect(serialized.fields["_typeID"]).toBe(4)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["blockchainid"]).toBe(blockchainIDHex)
        expect(serialized.fields["networkid"]).toBe(networkIDHex)
        expect(serialized.fields["outs"].length).toBe(0)
        expect(serialized.fields["ins"].length).toBe(0)
        expect(serialized.fields["memo"]).toBe(mHex)
        expect(serialized.fields["destinationChain"]).toBe(cChainIDHex)
        expect(serialized.fields["exportOuts"].length).toBe(0)
      })

      test("SECPCredential", (): void => {
        const sigArray: Signature[] = []
        const secpcredential: SECPCredential = new SECPCredential(sigArray)
        const notes: string = "AVM SECPCredential"
        const serialized: Serialized = serialization.serialize(secpcredential, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("SECPCredential")
        expect(serialized.fields["_typeID"]).toBe(9)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["sigArray"].length).toBe(0)
      })

      test("NFTCredential", (): void => {
        const sigArray: Signature[] = []
        const nftcredential: NFTCredential = new NFTCredential(sigArray)
        const notes: string = "AVM NFTCredential"
        const serialized: Serialized = serialization.serialize(nftcredential, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("NFTCredential")
        expect(serialized.fields["_typeID"]).toBe(14)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["sigArray"].length).toBe(0)
      })

      test("InitialStates", (): void => {
        const initialstates: InitialStates = new InitialStates()
        const notes: string = "AVM InitialStates"
        const serialized: Serialized = serialization.serialize(initialstates, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("InitialStates")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()
        expect(serialized.fields["fxs"]).toStrictEqual({})
      })

      test("SECPTransferInput", (): void => {
        const secptransferinput: SECPTransferInput = new SECPTransferInput()
        const notes: string = "AVM SECPTransferInput"
        const serialized: Serialized = serialization.serialize(secptransferinput, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("SECPTransferInput")
        expect(serialized.fields["_typeID"]).toBe(5)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["sigIdxs"].length).toBe(0)
        expect(serialized.fields["amount"]).toBe(amountHex)
      })

      test("MinterSet", (): void => {
        const minterset: MinterSet = new MinterSet(threshold, minters)
        const notes: string = "AVM MinterSet"
        const serialized: Serialized = serialization.serialize(minterset, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("MinterSet")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()
        expect(serialized.fields["threshold"]).toBe(thresholdHex)
        expect(serialized.fields["minters"]).toStrictEqual([xAddressHex])
      })

      test("TransferableOperation", (): void => {
        const secpmintoutput: SECPMintOutput = new SECPMintOutput()
        const transferOutput: SECPTransferOutput = new SECPTransferOutput()
        const utxoids: string[] = []
        const secpmintoperation: SECPMintOperation = new SECPMintOperation(secpmintoutput, transferOutput)
        const transferableoperation: TransferableOperation = new TransferableOperation(assetid, utxoids, secpmintoperation)
        const notes: string = "AVM TransferableOperation"
        const serialized: Serialized = serialization.serialize(transferableoperation, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("TransferableOperation")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()
        expect(serialized.fields["assetid"]).toBe(assetidHex)
        expect(serialized.fields["utxoIDs"]).toStrictEqual([])
      })

      test("SECPMintOperation", (): void => {
        const secpmintoutput: SECPMintOutput = new SECPMintOutput()
        const secptransferoutput: SECPTransferOutput = new SECPTransferOutput()
        const secpmintoperation: SECPMintOperation = new SECPMintOperation(secpmintoutput, secptransferoutput)
        const notes: string = "AVM SECPMintOperation"
        const serialized: Serialized = serialization.serialize(secpmintoperation, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("SECPMintOperation")
        expect(serialized.fields["_typeID"]).toBe(8)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["sigIdxs"].length).toBe(0)
      })

      test("NFTMintOperation", (): void => {
        const secpmintoutput: SECPMintOutput = new SECPMintOutput()
        const nftmintoperation: NFTMintOperation = new NFTMintOperation(groupID, payload, [secpmintoutput])
        const notes: string = "AVM NFTMintOperation"
        const serialized: Serialized = serialization.serialize(nftmintoperation, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("NFTMintOperation")
        expect(serialized.fields["_typeID"]).toBe(12)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["sigIdxs"].length).toBe(0)
        expect(serialized.fields["groupID"]).toBe(groupIDHex)
        expect(serialized.fields["payload"]).toBe(payloadHex)
      })

      test("NFTTransferOperation", (): void => {
        const nfttransferoutput: NFTTransferOutput = new NFTTransferOutput(groupID, payload)
        const nfttransferoperation: NFTTransferOperation = new NFTTransferOperation(nfttransferoutput)
        const notes: string = "AVM NFTTransferOperation"
        const serialized: Serialized = serialization.serialize(nfttransferoperation, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("NFTTransferOperation")
        expect(serialized.fields["_typeID"]).toBe(13)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["sigIdxs"].length).toBe(0)
      })

      test("UTXOID", (): void => {
        const bsize: string = "00000024"
        const bytes: string = "000000000000000000000000000000000000000000000000000000000000000000000000"
        const utxoid: UTXOID = new UTXOID()
        const notes: string = "AVM UTXOID"
        const serialized: Serialized = serialization.serialize(utxoid, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("UTXOID")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()
        expect(serialized.fields["bsize"]).toBe(bsize)
        expect(serialized.fields["bytes"]).toBe(bytes)
      })

      test("TransferableOutput", (): void => {
        const secpmintoutput: SECPMintOutput = new SECPMintOutput()
        const transferableoutput: TransferableOutput = new TransferableOutput(assetid, secpmintoutput)
        const notes: string = "AVM TransferableOutput"
        const serialized: Serialized = serialization.serialize(transferableoutput, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("TransferableOutput")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()
        expect(serialized.fields["assetID"]).toBe(assetidHex)
      })

      test("SECPTransferOutput", (): void => {
        const secptransferoutput: SECPTransferOutput = new SECPTransferOutput()
        const notes: string = "AVM SECPTransferOutput"
        const serialized: Serialized = serialization.serialize(secptransferoutput, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("SECPTransferOutput")
        expect(serialized.fields["_typeID"]).toBe(7)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["locktime"]).toBe(locktimeHex)
        expect(serialized.fields["threshold"]).toBe(thresholdHex)
        expect(serialized.fields["addresses"]).toStrictEqual([])
        expect(serialized.fields["amount"]).toBe(amountHex)
      })

      test("SECPMintOutput", (): void => {
        const secpmintoutput: SECPMintOutput = new SECPMintOutput()
        const notes: string = "AVM SECPMintOutput"
        const serialized: Serialized = serialization.serialize(secpmintoutput, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("SECPMintOutput")
        expect(serialized.fields["_typeID"]).toBe(6)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["locktime"]).toBe(locktimeHex)
        expect(serialized.fields["threshold"]).toBe(thresholdHex)
        expect(serialized.fields["addresses"]).toStrictEqual([])
      })

      test("NFTMintOutput", (): void => {
        const nftmintoutput: NFTMintOutput = new NFTMintOutput(groupID)
        const notes: string = "AVM NFTMintOutput"
        const serialized: Serialized = serialization.serialize(nftmintoutput, vm, hex, notes)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("NFTMintOutput")
        expect(serialized.fields["_typeID"]).toBe(10)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["locktime"]).toBe(locktimeHex)
        expect(serialized.fields["threshold"]).toBe(thresholdHex)
        expect(serialized.fields["addresses"]).toStrictEqual([])
        expect(serialized.fields["groupID"]).toBe(groupIDHex)
      })

      test("NFTTransferOutput", (): void => {
        const nfttransferoutput: NFTTransferOutput = new NFTTransferOutput(groupID, payload)
        const notes: string = "AVM NFTTransferOutput"
        const serialized: Serialized = serialization.serialize(nfttransferoutput, vm, hex, notes)
        console.log(serialized)
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("NFTTransferOutput")
        expect(serialized.fields["_typeID"]).toBe(11)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["locktime"]).toBe(locktimeHex)
        expect(serialized.fields["threshold"]).toBe(thresholdHex)
        expect(serialized.fields["addresses"]).toStrictEqual([])
        expect(serialized.fields["groupID"]).toBe(groupIDHex)
        expect(serialized.fields["payload"]).toBe(payloadHex)
      })
    })
  })

  // describe("Common", (): void => {
  //   test("Address", (): void => {
  //     const bsize: string = '00000014'
  //     const address: Address = new Address()
  //     const notes: string = "Address"
  //     const serialized: Serialized = serialization.serialize(address, vm, hex, notes)
  //     expect(serialized.vm).toBe(vm)
  //     expect(serialized.encoding).toBe(hex)
  //     expect(serialized.notes).toBe(notes)
  //     expect(serialized.fields["_typeName"]).toBe("Address")
  //     expect(serialized.fields["_typeID"]).toBeNull()
  //     expect(serialized.fields["_codecID"]).toBeNull()
  //     expect(serialized.fields["bsize"]).toBe(bsize)
  //     expect(serialized.fields["bytes"]).toBe(bytes)
  //   })
  // })
})
