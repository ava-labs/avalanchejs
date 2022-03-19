import BN from "bn.js"
import { Buffer } from "buffer/"
import {
  BaseTx,
  CreateAssetTx,
  ExportTx,
  GenesisAsset,
  ImportTx,
  InitialStates,
  MinterSet,
  NFTCredential,
  NFTMintOperation,
  NFTMintOutput,
  NFTTransferOperation,
  NFTTransferOutput,
  OperationTx,
  SECPCredential,
  SECPMintOperation,
  SECPMintOutput,
  SECPTransferInput,
  SECPTransferOutput,
  TransferableInput,
  TransferableOperation,
  TransferableOutput,
  Tx,
  UnsignedTx,
  UTXO,
  UTXOID,
  UTXOSet
} from "src/apis/avm"
import { Address, Serialized, Signature } from "src/common"
import {
  DefaultNetworkID,
  Defaults,
  Serialization,
  SerializedEncoding,
  SerializedType
} from "../../src/utils"
import { getPreferredHRP } from "../../src/utils"

const serialization: Serialization = Serialization.getInstance()

describe("Serialization", (): void => {
  const address: string = "X-avax1wst8jt3z3fm9ce0z6akj3266zmgccdp03hjlaj"
  const nodeID: string = "NodeID-MFrZFVCXPv5iCn6M9K6XduxGTYp891xXZ"
  const privateKey: string =
    "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
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
      const str: string = serialization.encoder(
        address,
        encoding,
        "bech32",
        "bech32"
      )
      const decoded: string = serialization.decoder(
        str,
        encoding,
        "bech32",
        "bech32",
        hrp,
        chainID
      )
      expect(address).toEqual(decoded)
    })

    test("nodeID", (): void => {
      const str: string = serialization.encoder(
        nodeID,
        encoding,
        "nodeID",
        "nodeID"
      )
      const decoded: string = serialization.decoder(
        str,
        encoding,
        "nodeID",
        "nodeID"
      )
      expect(nodeID).toEqual(decoded)
    })

    test("privateKey", (): void => {
      const str: string = serialization.encoder(
        privateKey,
        encoding,
        "privateKey",
        "privateKey"
      )
      const decoded: string = serialization.decoder(
        str,
        encoding,
        "privateKey",
        "privateKey"
      )
      expect(privateKey).toEqual(decoded)
    })

    test("cb58", (): void => {
      const str: string = serialization.encoder(cb58, encoding, "cb58", "cb58")
      const decoded: string = serialization.decoder(
        str,
        encoding,
        "cb58",
        "cb58"
      )
      expect(cb58).toEqual(decoded)
    })

    test("base58", (): void => {
      const str: string = serialization.encoder(
        cb58,
        encoding,
        "base58",
        "base58"
      )
      const decoded: string = serialization.decoder(
        str,
        encoding,
        "base58",
        "base58"
      )
      expect(cb58).toEqual(decoded)
    })

    test("base64", (): void => {
      const str: string = serialization.encoder(
        base64,
        encoding,
        "base64",
        "base64"
      )
      const decoded: string = serialization.decoder(
        str,
        encoding,
        "base64",
        "base64"
      )
      expect(base64).toEqual(decoded)
    })

    test("hex", (): void => {
      const str: string = serialization.encoder(hex, encoding, "hex", "hex")
      const decoded: string = serialization.decoder(str, encoding, "hex", "hex")
      expect(hex).toEqual(decoded)
    })

    test("utf8", (): void => {
      const str: string = serialization.encoder(name, encoding, "utf8", "utf8")
      const decoded: string = serialization.decoder(
        str,
        encoding,
        "utf8",
        "utf8"
      )
      expect(name).toBe(decoded)
    })

    test("decimalString", (): void => {
      const str: string = serialization.encoder(
        decimalString,
        encoding,
        "decimalString",
        "decimalString"
      )
      const decoded: string = serialization.decoder(
        str,
        encoding,
        "decimalString",
        "decimalString"
      )
      expect(decimalString).toBe(decoded)
    })

    test("number", (): void => {
      const str: string = serialization.encoder(
        num,
        encoding,
        "number",
        "number"
      )
      const decoded: string = serialization.decoder(
        str,
        encoding,
        "number",
        "number"
      )
      expect(num).toBe(decoded)
    })

    test("Buffer", (): void => {
      const str: string = serialization.encoder(
        denomination,
        encoding,
        "Buffer",
        "decimalString",
        1
      )
      const decoded: Buffer = serialization.decoder(
        str,
        encoding,
        "decimalString",
        "Buffer",
        1
      )
      expect(denomination.toString("hex")).toBe(decoded.toString("hex"))
    })
  })

  describe("serialize && deserialize", (): void => {
    const networkID: number = 1337
    const m: string = "2Zc54v4ek37TEwu4LiV3j41PUMRd6acDDU3ZCVSxE7X"
    const mHex: string =
      "66726f6d20736e6f77666c616b6520746f206176616c616e636865"
    const memo: Buffer = serialization.typeToBuffer(m, "cb58")
    const cChainID: string =
      "2CA6j5zYzasynPsFeNoqWkmTCt3VScMvXUZHbfDJ8k3oGzAPtU"
    const cChainIDHex: string =
      "9d0775f450604bd2fbc49ce0c5c1c6dfeb2dc2acb8c92c26eeae6e6df4502b19"
    const hex: SerializedEncoding = "hex"
    const cb58: SerializedEncoding = "cb58"
    const utf8: SerializedType = "utf8"
    const amount: BN = new BN(0)
    const amountHex: string = "0000000000000000"
    const bytes: string = "0000000000000000000000000000000000000000"
    const xAddress: string = "X-avax1pdurs53v6vtue9sw7am9ayjqh9mcnqe9s80sgn"
    const xAddressHex: string = "0b7838522cd317cc960ef7765e9240b977898325"
    const address: string = "X-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u00z96u"
    const bech32: SerializedType = "bech32"
    const addressBuf: Buffer = serialization.typeToBuffer(address, bech32)
    const threshold: number = 1
    const thresholdHex: string = "00000001"
    const minters: string[] = [xAddress]
    const assetID: Buffer = serialization.typeToBuffer(cChainID, cb58)
    const assetidHex: string =
      "9d0775f450604bd2fbc49ce0c5c1c6dfeb2dc2acb8c92c26eeae6e6df4502b19"
    const payload: Buffer = Buffer.from("From snowflake to Avalanche")
    const groupIDHex: string = "00003039"
    const payloadHex: string =
      "46726f6d20736e6f77666c616b6520746f204176616c616e636865"
    const locktime: BN = new BN(0)
    const locktimeHex: string = "0000000000000000"

    describe("AVM", (): void => {
      const blockchainIDCB58: Buffer = serialization.typeToBuffer(
        Defaults.network[12345]["X"].blockchainID,
        cb58
      )
      const blockchainIDHex: string =
        "d891ad56056d9c01f18f43f58b5c784ad07a4a49cf3d1f11623804b5cba2c6bf"
      const defaultNetworkIDHex: string = "00000001"
      const localNetworkIDHex: string = "00000539"
      const outs: TransferableOutput[] = []
      const ins: TransferableInput[] = []
      const vm: string = "AVM"
      const groupID: number = 12345

      test("GenesisAsset", (): void => {
        const assetAlias: string = "asset1"
        const name: string = "asset1"
        const symbol: string = "MFCA"
        const nameHex: string = serialization.encoder(name, hex, utf8, utf8)
        const symbolHex: string = serialization.encoder(symbol, hex, utf8, utf8)
        const denomination: number = 1
        const vcapSecpOutput = new SECPTransferOutput(
          amount,
          [addressBuf],
          locktime,
          threshold
        )
        const initialStates: InitialStates = new InitialStates()
        initialStates.addOutput(vcapSecpOutput)
        const genesisasset: GenesisAsset = new GenesisAsset(
          assetAlias,
          name,
          symbol,
          denomination,
          initialStates,
          memo
        )
        const genesisasset2: GenesisAsset = new GenesisAsset()
        const notes: string = "AVM GenesisAsset"
        const serialized: Serialized = serialization.serialize(
          genesisasset,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("GenesisAsset")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()
        expect(serialized.fields["networkID"]).toBe(defaultNetworkIDHex)
        expect(serialized.fields["name"]).toBe(nameHex)
        expect(serialized.fields["symbol"]).toBe(symbolHex)
        expect(serialized.fields["denomination"]).toBe("01")
        expect(serialized.fields["memo"]).toBe(mHex)

        serialization.deserialize(serialized, genesisasset2)
        expect(genesisasset2.getTypeName()).toBe("GenesisAsset")
        expect(genesisasset2.getTypeID()).toBeUndefined()
        expect(genesisasset2.getCodecID()).toBeUndefined()
        expect(genesisasset2.getBlockchainID().toString(hex)).toBe(
          "1010101010101010101010101010101010101010101010101010101010101010"
        )
        expect(genesisasset2.getNetworkID()).toBe(DefaultNetworkID)
        expect(genesisasset2.getOuts()).toStrictEqual([])
        expect(genesisasset2.getIns()).toStrictEqual([])
        expect(genesisasset2.getAssetAlias()).toBe(assetAlias)
        expect(genesisasset2.getName()).toBe(name)
        expect(genesisasset2.getSymbol()).toBe(symbol)
        expect(genesisasset2.getDenomination()).toBe(denomination)
        expect(serialization.bufferToType(genesisasset2.getMemo(), cb58)).toBe(
          m
        )
        expect(genesisasset2.toBuffer().toString(hex)).toBe(
          genesisasset.toBuffer().toString(hex)
        )
        expect(genesisasset2.toString()).toBe(genesisasset.toString())
      })

      test("BaseTx", (): void => {
        const basetx: BaseTx = new BaseTx(
          networkID,
          blockchainIDCB58,
          outs,
          ins,
          memo
        )
        const basetx2: BaseTx = new BaseTx()
        const notes: string = "AVM BaseTx"
        const serialized: Serialized = serialization.serialize(
          basetx,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("BaseTx")
        expect(serialized.fields["_typeID"]).toBe(0)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["blockchainID"]).toBe(blockchainIDHex)
        expect(serialized.fields["networkID"]).toBe(localNetworkIDHex)
        expect(serialized.fields["outs"]).toStrictEqual([])
        expect(serialized.fields["ins"]).toStrictEqual([])
        expect(serialized.fields["memo"]).toBe(mHex)

        serialization.deserialize(serialized, basetx2)
        expect(basetx2.getTypeName()).toBe("BaseTx")
        expect(basetx2.getTypeID()).toBe(0)
        expect(basetx2.getCodecID()).toBe(0)
        expect(basetx2.getBlockchainID().toString(hex)).toBe(blockchainIDHex)
        expect(basetx2.getNetworkID()).toBe(networkID)
        expect(basetx2.getOuts()).toStrictEqual([])
        expect(basetx2.getIns()).toStrictEqual([])
        expect(serialization.bufferToType(basetx2.getMemo(), cb58)).toBe(m)
        expect(basetx2.toBuffer().toString(hex)).toBe(
          basetx.toBuffer().toString(hex)
        )
        expect(basetx2.toString()).toBe(basetx.toString())
      })

      test("CreateAssetTx", (): void => {
        const name: string = "Test Token"
        const nameHex: string = "5465737420546f6b656e"
        const symbol: string = "TEST"
        const symbolHex: string = "54455354"
        const denomination: number = 1
        const denominationHex: string = "01"
        const initialState: InitialStates = new InitialStates()
        const createassettx: CreateAssetTx = new CreateAssetTx(
          networkID,
          blockchainIDCB58,
          outs,
          ins,
          memo,
          name,
          symbol,
          denomination,
          initialState
        )
        const createassettx2: CreateAssetTx = new CreateAssetTx()
        const notes: string = "AVM CreateAssetTx"
        const serialized: Serialized = serialization.serialize(
          createassettx,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("CreateAssetTx")
        expect(serialized.fields["_typeID"]).toBe(1)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["blockchainID"]).toBe(blockchainIDHex)
        expect(serialized.fields["networkID"]).toBe(localNetworkIDHex)
        expect(serialized.fields["outs"]).toStrictEqual([])
        expect(serialized.fields["ins"]).toStrictEqual([])
        expect(serialized.fields["memo"]).toBe(mHex)
        expect(serialized.fields["name"]).toBe(nameHex)
        expect(serialized.fields["symbol"]).toBe(symbolHex)
        expect(serialized.fields["denomination"]).toBe(denominationHex)

        serialization.deserialize(serialized, createassettx2)
        expect(createassettx2.getTypeName()).toBe("CreateAssetTx")
        expect(createassettx2.getTypeID()).toBe(1)
        expect(createassettx2.getCodecID()).toBe(0)
        expect(createassettx2.getBlockchainID().toString(hex)).toBe(
          blockchainIDHex
        )
        expect(createassettx2.getNetworkID()).toBe(networkID)
        expect(createassettx2.getOuts()).toStrictEqual([])
        expect(createassettx2.getIns()).toStrictEqual([])
        expect(createassettx2.getName()).toBe(name)
        expect(createassettx2.getSymbol()).toBe(symbol)
        expect(createassettx2.getDenomination()).toBe(denomination)
        expect(serialization.bufferToType(createassettx2.getMemo(), cb58)).toBe(
          m
        )
        expect(createassettx2.toBuffer().toString(hex)).toBe(
          createassettx.toBuffer().toString(hex)
        )
        expect(createassettx2.toString()).toBe(createassettx.toString())
      })

      test("OperationTx", (): void => {
        const ops: TransferableOperation[] = []
        const operationtx: OperationTx = new OperationTx(
          networkID,
          blockchainIDCB58,
          outs,
          ins,
          memo,
          ops
        )
        const operationtx2: OperationTx = new OperationTx()
        const notes: string = "AVM OperationTx"
        const serialized: Serialized = serialization.serialize(
          operationtx,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("OperationTx")
        expect(serialized.fields["_typeID"]).toBe(2)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["blockchainID"]).toBe(blockchainIDHex)
        expect(serialized.fields["networkID"]).toBe(localNetworkIDHex)
        expect(serialized.fields["outs"]).toStrictEqual([])
        expect(serialized.fields["ins"]).toStrictEqual([])
        expect(serialized.fields["memo"]).toBe(mHex)
        expect(serialized.fields["ops"]).toStrictEqual([])

        serialization.deserialize(serialized, operationtx2)
        expect(operationtx2.getTypeName()).toBe("OperationTx")
        expect(operationtx2.getTypeID()).toBe(2)
        expect(operationtx2.getCodecID()).toBe(0)
        expect(operationtx2.getBlockchainID().toString(hex)).toBe(
          blockchainIDHex
        )
        expect(operationtx2.getNetworkID()).toBe(networkID)
        expect(operationtx2.getOuts()).toStrictEqual([])
        expect(operationtx2.getIns()).toStrictEqual([])
        expect(operationtx2.getOperations()).toStrictEqual([])
        expect(serialization.bufferToType(operationtx2.getMemo(), cb58)).toBe(m)
        expect(operationtx2.toBuffer().toString(hex)).toBe(
          operationtx.toBuffer().toString(hex)
        )
        expect(operationtx2.toString()).toBe(operationtx.toString())
      })

      test("ImportTx", (): void => {
        const sourceChain: Buffer = serialization.typeToBuffer(cChainID, cb58)
        const importIns: TransferableInput[] = []
        const importtx: ImportTx = new ImportTx(
          networkID,
          blockchainIDCB58,
          outs,
          ins,
          memo,
          sourceChain,
          importIns
        )
        const importtx2: ImportTx = new ImportTx()
        const notes: string = "AVM ImportTx"
        const serialized: Serialized = serialization.serialize(
          importtx,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("ImportTx")
        expect(serialized.fields["_typeID"]).toBe(3)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["blockchainID"]).toBe(blockchainIDHex)
        expect(serialized.fields["networkID"]).toBe(localNetworkIDHex)
        expect(serialized.fields["outs"]).toStrictEqual([])
        expect(serialized.fields["ins"]).toStrictEqual([])
        expect(serialized.fields["memo"]).toBe(mHex)
        expect(serialized.fields["sourceChain"]).toBe(cChainIDHex)
        expect(serialized.fields["importIns"]).toStrictEqual([])

        serialization.deserialize(serialized, importtx2)
        expect(importtx2.getTypeName()).toBe("ImportTx")
        expect(importtx2.getTypeID()).toBe(3)
        expect(importtx2.getCodecID()).toBe(0)
        expect(importtx2.getBlockchainID().toString(hex)).toBe(blockchainIDHex)
        expect(importtx2.getNetworkID()).toBe(networkID)
        expect(importtx2.getOuts()).toStrictEqual([])
        expect(importtx2.getIns()).toStrictEqual([])
        expect(importtx2.getSourceChain().toString(hex)).toBe(
          sourceChain.toString(hex)
        )
        expect(importtx2.getImportInputs()).toStrictEqual([])
        expect(serialization.bufferToType(importtx2.getMemo(), cb58)).toBe(m)
        expect(importtx2.toBuffer().toString(hex)).toBe(
          importtx.toBuffer().toString(hex)
        )
        expect(importtx2.toString()).toBe(importtx.toString())
      })

      test("ExportTx", (): void => {
        const destinationChain: Buffer = serialization.typeToBuffer(
          cChainID,
          cb58
        )
        const exportOuts: TransferableOutput[] = []
        const exporttx: ExportTx = new ExportTx(
          networkID,
          blockchainIDCB58,
          outs,
          ins,
          memo,
          destinationChain,
          exportOuts
        )
        const exporttx2: ExportTx = new ExportTx()
        const notes: string = "AVM ExportTx"
        const serialized: Serialized = serialization.serialize(
          exporttx,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("ExportTx")
        expect(serialized.fields["_typeID"]).toBe(4)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["blockchainID"]).toBe(blockchainIDHex)
        expect(serialized.fields["networkID"]).toBe(localNetworkIDHex)
        expect(serialized.fields["outs"]).toStrictEqual([])
        expect(serialized.fields["ins"]).toStrictEqual([])
        expect(serialized.fields["memo"]).toBe(mHex)
        expect(serialized.fields["destinationChain"]).toBe(cChainIDHex)
        expect(serialized.fields["exportOuts"]).toStrictEqual([])

        serialization.deserialize(serialized, exporttx2)
        expect(exporttx2.getTypeName()).toBe("ExportTx")
        expect(exporttx2.getTypeID()).toBe(4)
        expect(exporttx2.getCodecID()).toBe(0)
        expect(exporttx2.getBlockchainID().toString(hex)).toBe(blockchainIDHex)
        expect(exporttx2.getNetworkID()).toBe(networkID)
        expect(exporttx2.getOuts()).toStrictEqual([])
        expect(exporttx2.getIns()).toStrictEqual([])
        expect(exporttx2.getDestinationChain().toString(hex)).toBe(
          destinationChain.toString(hex)
        )
        expect(exporttx2.getExportOutputs()).toStrictEqual([])
        expect(serialization.bufferToType(exporttx2.getMemo(), cb58)).toBe(m)
        expect(exporttx2.toBuffer().toString(hex)).toBe(
          exporttx.toBuffer().toString(hex)
        )
        expect(exporttx2.toString()).toBe(exporttx.toString())
      })

      test("SECPCredential", (): void => {
        const sigArray: Signature[] = []
        const secpcredential: SECPCredential = new SECPCredential(sigArray)
        const secpcredential2: SECPCredential = new SECPCredential()
        const notes: string = "AVM SECPCredential"
        const serialized: Serialized = serialization.serialize(
          secpcredential,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("SECPCredential")
        expect(serialized.fields["_typeID"]).toBe(9)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["sigArray"]).toStrictEqual([])

        serialization.deserialize(serialized, secpcredential2)
        expect(secpcredential2.getTypeName()).toBe("SECPCredential")
        expect(secpcredential2.getTypeID()).toBe(9)
        expect(secpcredential2.getCodecID()).toBe(0)
        expect(secpcredential2.getCredentialID()).toBe(9)
        expect(secpcredential2.toBuffer().toString(hex)).toBe(
          secpcredential.toBuffer().toString(hex)
        )
        expect(secpcredential2.toString()).toBe(secpcredential.toString())
      })

      test("NFTCredential", (): void => {
        const sigArray: Signature[] = []
        const nftcredential: NFTCredential = new NFTCredential(sigArray)
        const nftcredential2: NFTCredential = new NFTCredential()
        const notes: string = "AVM NFTCredential"
        const serialized: Serialized = serialization.serialize(
          nftcredential,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("NFTCredential")
        expect(serialized.fields["_typeID"]).toBe(14)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["sigArray"]).toStrictEqual([])

        serialization.deserialize(serialized, nftcredential2)
        expect(nftcredential2.getTypeName()).toBe("NFTCredential")
        expect(nftcredential2.getTypeID()).toBe(14)
        expect(nftcredential2.getCodecID()).toBe(0)
        expect(nftcredential2.getCredentialID()).toBe(14)
        expect(nftcredential2.toBuffer().toString(hex)).toBe(
          nftcredential.toBuffer().toString(hex)
        )
        expect(nftcredential2.toString()).toBe(nftcredential.toString())
      })

      test("InitialStates", (): void => {
        const initialStates: InitialStates = new InitialStates()
        const initialStates2: InitialStates = new InitialStates()
        const notes: string = "AVM InitialStates"
        const serialized: Serialized = serialization.serialize(
          initialStates,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("InitialStates")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()
        expect(serialized.fields["fxs"]).toStrictEqual({})

        serialization.deserialize(serialized, initialStates2)
        expect(initialStates2.getTypeName()).toBe("InitialStates")
        expect(initialStates2.getTypeID()).toBeUndefined()
        expect(initialStates2.getCodecID()).toBeUndefined()
        expect(initialStates2.toBuffer().toString(hex)).toBe(
          initialStates.toBuffer().toString(hex)
        )
        expect(initialStates2.toString()).toBe(initialStates.toString())
      })

      test("SECPTransferInput", (): void => {
        const secptransferinput: SECPTransferInput = new SECPTransferInput()
        const secptransferinput2: SECPTransferInput = new SECPTransferInput()
        const notes: string = "AVM SECPTransferInput"
        const serialized: Serialized = serialization.serialize(
          secptransferinput,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("SECPTransferInput")
        expect(serialized.fields["_typeID"]).toBe(5)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["sigIdxs"]).toStrictEqual([])
        expect(serialized.fields["amount"]).toBe(amountHex)

        serialization.deserialize(serialized, secptransferinput2)
        expect(secptransferinput2.getTypeName()).toBe("SECPTransferInput")
        expect(secptransferinput2.getTypeID()).toBe(5)
        expect(secptransferinput2.getCodecID()).toBe(0)
        expect(secptransferinput2.getAmount().toString()).toBe(
          amount.toString()
        )
        expect(secptransferinput2.getSigIdxs()).toStrictEqual([])
        expect(secptransferinput2.toBuffer().toString(hex)).toBe(
          secptransferinput.toBuffer().toString(hex)
        )
        expect(secptransferinput2.toString()).toBe(secptransferinput.toString())
      })

      test("MinterSet", (): void => {
        const minterset: MinterSet = new MinterSet(threshold, minters)
        const minterset2: MinterSet = new MinterSet()
        const notes: string = "AVM MinterSet"
        const serialized: Serialized = serialization.serialize(
          minterset,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("MinterSet")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()
        expect(serialized.fields["threshold"]).toBe(thresholdHex)
        expect(serialized.fields["minters"]).toStrictEqual([xAddressHex])

        serialization.deserialize(serialized, minterset2)
        expect(minterset2.getTypeName()).toBe("MinterSet")
        expect(minterset2.getTypeID()).toBeUndefined()
        expect(minterset2.getCodecID()).toBeUndefined()
        expect(minterset2.getThreshold()).toBe(threshold)
        expect(minterset2.getMinters()).toStrictEqual([
          serialization.typeToBuffer(xAddressHex, hex)
        ])
      })

      test("TransferableOperation", (): void => {
        const secpmintoutput: SECPMintOutput = new SECPMintOutput()
        const transferOutput: SECPTransferOutput = new SECPTransferOutput()
        const utxoids: string[] = []
        const secpmintoperation: SECPMintOperation = new SECPMintOperation(
          secpmintoutput,
          transferOutput
        )
        const transferableoperation: TransferableOperation =
          new TransferableOperation(assetID, utxoids, secpmintoperation)
        const transferableoperation2: TransferableOperation =
          new TransferableOperation()
        const notes: string = "AVM TransferableOperation"
        const serialized: Serialized = serialization.serialize(
          transferableoperation,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("TransferableOperation")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()
        expect(serialized.fields["assetID"]).toBe(assetidHex)
        expect(serialized.fields["utxoIDs"]).toStrictEqual([])

        serialization.deserialize(serialized, transferableoperation2)
        expect(transferableoperation2.getTypeName()).toBe(
          "TransferableOperation"
        )
        expect(transferableoperation2.getTypeID()).toBeUndefined()
        expect(transferableoperation2.getCodecID()).toBeUndefined()
        expect(transferableoperation2.getAssetID().toString(hex)).toBe(
          assetID.toString(hex)
        )
        expect(transferableoperation2.getUTXOIDs()).toStrictEqual([])
        expect(transferableoperation2.toBuffer().toString(hex)).toBe(
          transferableoperation.toBuffer().toString(hex)
        )
        expect(transferableoperation2.toString()).toBe(
          transferableoperation.toString()
        )
      })

      test("SECPMintOperation", (): void => {
        const secpmintoutput: SECPMintOutput = new SECPMintOutput()
        const secptransferoutput: SECPTransferOutput = new SECPTransferOutput()
        const secpmintoperation: SECPMintOperation = new SECPMintOperation(
          secpmintoutput,
          secptransferoutput
        )
        const secpmintoperation2: SECPMintOperation = new SECPMintOperation()
        const notes: string = "AVM SECPMintOperation"
        const serialized: Serialized = serialization.serialize(
          secpmintoperation,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("SECPMintOperation")
        expect(serialized.fields["_typeID"]).toBe(8)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["sigIdxs"]).toStrictEqual([])

        serialization.deserialize(serialized, secpmintoperation2)
        expect(secpmintoperation2.getTypeName()).toBe("SECPMintOperation")
        expect(secpmintoperation2.getTypeID()).toBe(8)
        expect(secpmintoperation2.getCodecID()).toBe(0)
        expect(secpmintoperation2.getSigIdxs()).toStrictEqual([])
        expect(secpmintoperation2.toBuffer().toString(hex)).toBe(
          secpmintoperation.toBuffer().toString(hex)
        )
        expect(secpmintoperation2.toString()).toBe(secpmintoperation.toString())
      })

      test("NFTMintOperation", (): void => {
        // TODO - fix this type mismatch
        // Error - Serializable.deserialize: _typeName mismatch -- expected: OutputOwners -- received: NFTMintOutput
        // const nftmintoutput: NFTMintOutput = new NFTMintOutput()
        // const nftmintoperation: NFTMintOperation = new NFTMintOperation(groupID, payload, [nftmintoutput])
        // const nftmintoperation2: NFTMintOperation = new NFTMintOperation()
        // const notes: string = "AVM NFTMintOperation"
        // const serialized: Serialized = serialization.serialize(nftmintoperation, vm, hex, notes)
        // expect(serialized.vm).toBe(vm)
        // expect(serialized.encoding).toBe(hex)
        // expect(serialized.notes).toBe(notes)
        // expect(serialized.fields["_typeName"]).toBe("NFTMintOperation")
        // expect(serialized.fields["_typeID"]).toBe(12)
        // expect(serialized.fields["_codecID"]).toBe(0)
        // expect(serialized.fields["sigIdxs"]).toStrictEqual([])
        // expect(serialized.fields["groupID"]).toBe(groupIDHex)
        // expect(serialized.fields["payload"]).toBe(payloadHex)
        // serialization.deserialize(serialized, nftmintoperation2)
        // expect(nftmintoperation2.getTypeName()).toBe("NFTMintOperation")
        // expect(nftmintoperation2.getTypeID()).toBe(12)
        // expect(nftmintoperation2.getCodecID()).toBe(0)
        // expect(nftmintoperation2.getSigIdxs()).toStrictEqual([])
        // expect(nftmintoperation2.getGroupID()).toBe(groupIDHex)
        // expect(nftmintoperation2.getPayload().toString("hex")).toBe(payload.toString("hex"))
        // expect(nftmintoperation2.toBuffer().toString("hex")).toBe(nftmintoperation.toBuffer().toString("hex"))
        // expect(nftmintoperation2.toString()).toBe(nftmintoperation.toString())
      })

      test("NFTTransferOperation", (): void => {
        const nfttransferoutput: NFTTransferOutput = new NFTTransferOutput(
          groupID,
          payload
        )
        const nfttransferoperation: NFTTransferOperation =
          new NFTTransferOperation(nfttransferoutput)
        const nfttransferoperation2: NFTTransferOperation =
          new NFTTransferOperation()
        const notes: string = "AVM NFTTransferOperation"
        const serialized: Serialized = serialization.serialize(
          nfttransferoperation,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("NFTTransferOperation")
        expect(serialized.fields["_typeID"]).toBe(13)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["sigIdxs"]).toStrictEqual([])

        serialization.deserialize(serialized, nfttransferoperation2)
        expect(nfttransferoperation2.getTypeName()).toBe("NFTTransferOperation")
        expect(nfttransferoperation2.getTypeID()).toBe(13)
        expect(nfttransferoperation2.getCodecID()).toBe(0)
        expect(nfttransferoperation2.getOperationID()).toBe(13)
        expect(nfttransferoperation2.getCredentialID()).toBe(14)
        expect(nfttransferoperation2.getOutput().toBuffer().toString(hex)).toBe(
          nfttransferoutput.toBuffer().toString(hex)
        )
        expect(nfttransferoperation2.getSigIdxs()).toStrictEqual([])
        expect(nfttransferoperation2.toBuffer().toString(hex)).toBe(
          nfttransferoperation.toBuffer().toString(hex)
        )
        expect(nfttransferoperation2.toString()).toBe(
          nfttransferoperation.toString()
        )
      })

      test("UTXOID", (): void => {
        const bsize: string = "00000024"
        const size: number = 36
        const bytes: string =
          "000000000000000000000000000000000000000000000000000000000000000000000000"
        const utxoid: UTXOID = new UTXOID()
        const utxoid2: UTXOID = new UTXOID()
        const notes: string = "AVM UTXOID"
        const serialized: Serialized = serialization.serialize(
          utxoid,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("UTXOID")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()
        expect(serialized.fields["bsize"]).toBe(bsize)
        expect(serialized.fields["bytes"]).toBe(bytes)

        serialization.deserialize(serialized, utxoid2)
        expect(utxoid2.getTypeName()).toBe("UTXOID")
        expect(utxoid2.getTypeID()).toBeUndefined()
        expect(utxoid2.getCodecID()).toBeUndefined()
        expect(utxoid2.getSize()).toBe(size)
        expect(utxoid2.toBuffer().toString(hex)).toBe(
          utxoid.toBuffer().toString(hex)
        )
        expect(utxoid2.toString()).toBe(utxoid2.toString())
      })

      test("TransferableOutput", (): void => {
        const secpmintoutput: SECPMintOutput = new SECPMintOutput()
        const transferableoutput: TransferableOutput = new TransferableOutput(
          assetID,
          secpmintoutput
        )
        const transferableoutput2: TransferableOutput = new TransferableOutput()
        const notes: string = "AVM TransferableOutput"
        const serialized: Serialized = serialization.serialize(
          transferableoutput,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("TransferableOutput")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()
        expect(serialized.fields["assetID"]).toBe(assetidHex)

        serialization.deserialize(serialized, transferableoutput2)
        expect(transferableoutput2.getTypeName()).toBe("TransferableOutput")
        expect(transferableoutput2.getTypeID()).toBeUndefined()
        expect(transferableoutput2.getCodecID()).toBeUndefined()
        expect(transferableoutput2.getAssetID().toString(hex)).toBe(
          assetID.toString(hex)
        )
        expect(transferableoutput2.toBuffer().toString(hex)).toBe(
          transferableoutput.toBuffer().toString(hex)
        )
        expect(transferableoutput2.toString()).toBe(
          transferableoutput.toString()
        )
      })

      test("SECPTransferOutput", (): void => {
        const secptransferoutput: SECPTransferOutput = new SECPTransferOutput()
        const secptransferoutput2: SECPTransferOutput = new SECPTransferOutput()
        const notes: string = "AVM SECPTransferOutput"
        const serialized: Serialized = serialization.serialize(
          secptransferoutput,
          vm,
          hex,
          notes
        )
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

        serialization.deserialize(serialized, secptransferoutput2)
        expect(secptransferoutput2.getTypeName()).toBe("SECPTransferOutput")
        expect(secptransferoutput2.getTypeID()).toBe(7)
        expect(secptransferoutput2.getCodecID()).toBe(0)
        expect(secptransferoutput2.getLocktime().toString()).toBe(
          locktime.toString()
        )
        expect(secptransferoutput2.getThreshold()).toBe(threshold)
        expect(secptransferoutput2.getAddresses()).toStrictEqual([])
        expect(secptransferoutput2.getAmount().toString()).toStrictEqual(
          amount.toString()
        )
        expect(secptransferoutput2.toBuffer().toString(hex)).toBe(
          secptransferoutput.toBuffer().toString(hex)
        )
        expect(secptransferoutput2.toString()).toBe(
          secptransferoutput.toString()
        )
      })

      test("SECPMintOutput", (): void => {
        const secpmintoutput: SECPMintOutput = new SECPMintOutput()
        const secpmintoutput2: SECPMintOutput = new SECPMintOutput()
        const notes: string = "AVM SECPMintOutput"
        const serialized: Serialized = serialization.serialize(
          secpmintoutput,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("SECPMintOutput")
        expect(serialized.fields["_typeID"]).toBe(6)
        expect(serialized.fields["_codecID"]).toBe(0)
        expect(serialized.fields["locktime"]).toBe(locktimeHex)
        expect(serialized.fields["threshold"]).toBe(thresholdHex)
        expect(serialized.fields["addresses"]).toStrictEqual([])

        serialization.deserialize(serialized, secpmintoutput2)
        expect(secpmintoutput2.getTypeName()).toBe("SECPMintOutput")
        expect(secpmintoutput2.getTypeID()).toBe(6)
        expect(secpmintoutput2.getCodecID()).toBe(0)
        expect(secpmintoutput2.getLocktime().toString()).toBe(
          locktime.toString()
        )
        expect(secpmintoutput2.getThreshold()).toBe(threshold)
        expect(secpmintoutput2.getAddresses()).toStrictEqual([])
        expect(secpmintoutput2.toBuffer().toString(hex)).toBe(
          secpmintoutput.toBuffer().toString(hex)
        )
        expect(secpmintoutput2.toString()).toBe(secpmintoutput.toString())
      })

      test("NFTMintOutput", (): void => {
        const nftmintoutput: NFTMintOutput = new NFTMintOutput(groupID)
        const nftmintoutput2: NFTMintOutput = new NFTMintOutput()
        const notes: string = "AVM NFTMintOutput"
        const serialized: Serialized = serialization.serialize(
          nftmintoutput,
          vm,
          hex,
          notes
        )
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

        serialization.deserialize(serialized, nftmintoutput2)
        expect(nftmintoutput2.getTypeName()).toBe("NFTMintOutput")
        expect(nftmintoutput2.getTypeID()).toBe(10)
        expect(nftmintoutput2.getCodecID()).toBe(0)
        expect(nftmintoutput2.getLocktime().toString()).toBe(
          locktime.toString()
        )
        expect(nftmintoutput2.getThreshold()).toBe(threshold)
        expect(nftmintoutput2.getAddresses()).toStrictEqual([])
        expect(nftmintoutput2.getGroupID()).toBe(groupID)
        expect(nftmintoutput2.toBuffer().toString(hex)).toBe(
          nftmintoutput.toBuffer().toString(hex)
        )
        expect(nftmintoutput2.toString()).toBe(nftmintoutput.toString())
      })

      test("NFTTransferOutput", (): void => {
        const nfttransferoutput: NFTTransferOutput = new NFTTransferOutput(
          groupID,
          payload
        )
        const nfttransferoutput2: NFTTransferOutput = new NFTTransferOutput()
        const notes: string = "AVM NFTTransferOutput"
        const serialized: Serialized = serialization.serialize(
          nfttransferoutput,
          vm,
          hex,
          notes
        )
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

        serialization.deserialize(serialized, nfttransferoutput2)
        expect(nfttransferoutput2.getTypeName()).toBe("NFTTransferOutput")
        expect(nfttransferoutput2.getTypeID()).toBe(11)
        expect(nfttransferoutput2.getCodecID()).toBe(0)
        expect(nfttransferoutput2.getLocktime().toString()).toBe(
          locktime.toString()
        )
        expect(nfttransferoutput2.getThreshold()).toBe(threshold)
        expect(nfttransferoutput2.getAddresses()).toStrictEqual([])
        expect(nfttransferoutput2.getGroupID()).toBe(groupID)
        expect(nfttransferoutput2.getPayload().toString(hex)).toBe(payloadHex)
        expect(nfttransferoutput2.toBuffer().toString(hex)).toBe(
          nfttransferoutput.toBuffer().toString(hex)
        )
        expect(nfttransferoutput2.toString()).toBe(nfttransferoutput.toString())
      })

      test("UnsignedTx", (): void => {
        const basetx: BaseTx = new BaseTx(
          networkID,
          blockchainIDCB58,
          outs,
          ins,
          memo
        )
        const unsignedtx: UnsignedTx = new UnsignedTx(basetx)
        const unsignedtx2: UnsignedTx = new UnsignedTx()
        const notes: string = "AVM UnsignedTx"
        const serialized: Serialized = serialization.serialize(
          unsignedtx,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("UnsignedTx")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()

        serialization.deserialize(serialized, unsignedtx2)
        expect(unsignedtx2.getTypeName()).toBe("UnsignedTx")
        expect(unsignedtx2.getTypeID()).toBeUndefined()
        // TODO - StandardUnsignedTx is setting codecID to 0
        // Bring this inline w/ the new codecID patterns
        // expect(unsignedtx2.getCodecID()).toBeUndefined()
        expect(unsignedtx2.toBuffer().toString(hex)).toBe(
          unsignedtx.toBuffer().toString(hex)
        )
        expect(unsignedtx2.toString()).toBe(unsignedtx.toString())
      })

      test("Tx", (): void => {
        const basetx: BaseTx = new BaseTx(
          networkID,
          blockchainIDCB58,
          outs,
          ins,
          memo
        )
        const unsignedtx: UnsignedTx = new UnsignedTx(basetx)
        const tx: Tx = new Tx(unsignedtx)
        const tx2: Tx = new Tx()
        const notes: string = "AVM Tx"
        const serialized: Serialized = serialization.serialize(
          tx,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("Tx")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()
        expect(serialized.fields["credentials"]).toStrictEqual([])

        serialization.deserialize(serialized, tx2)
        expect(tx2.getTypeName()).toBe("Tx")
        expect(tx2.getTypeID()).toBeUndefined()
        expect(tx2.getCodecID()).toBeUndefined()
        expect(tx2.getCredentials()).toStrictEqual([])
        expect(tx2.toBuffer().toString(hex)).toBe(tx.toBuffer().toString(hex))
        expect(tx2.toString()).toBe(tx.toString())
      })

      test("UTXO", (): void => {
        const codecID: number = 0
        const txID: Buffer = serialization.typeToBuffer(cChainID, cb58)
        const txidHex: string =
          "9d0775f450604bd2fbc49ce0c5c1c6dfeb2dc2acb8c92c26eeae6e6df4502b19"
        const outputidx: number = 0
        const outputidxHex: string = "00000000"
        const assetID: Buffer = serialization.typeToBuffer(cChainID, cb58)
        const nfttransferoutput: NFTTransferOutput = new NFTTransferOutput(
          groupID,
          payload
        )
        const utxo: UTXO = new UTXO(
          codecID,
          txID,
          outputidx,
          assetID,
          nfttransferoutput
        )
        const utxo2: UTXO = new UTXO()
        const notes: string = "AVM UTXO"
        const serialized: Serialized = serialization.serialize(
          utxo,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("UTXO")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()
        expect(serialized.fields["txid"]).toBe(txidHex)
        expect(serialized.fields["outputidx"]).toBe(outputidxHex)
        expect(serialized.fields["assetID"]).toBe(assetidHex)

        serialization.deserialize(serialized, utxo2)
        expect(utxo2.getTypeName()).toBe("UTXO")
        expect(utxo2.getTypeID()).toBeUndefined()
        // TODO - StandardUnsignedTx is setting codecID to 0
        // Bring this inline w/ the new codecID patterns
        // expect(utxo2.getCodecID()).toBeUndefined()
        expect(utxo2.getTxID().toString(hex)).toBe(txidHex)
        expect(utxo2.getOutputIdx().toString(hex)).toBe(outputidxHex)
        expect(utxo2.getAssetID().toString(hex)).toBe(assetID.toString(hex))
        expect(utxo2.toBuffer().toString(hex)).toBe(
          utxo.toBuffer().toString(hex)
        )
        expect(utxo2.toString()).toBe(utxo.toString())
      })

      test("UTXOSet", (): void => {
        const utxoset: UTXOSet = new UTXOSet()
        const utxoset2: UTXOSet = new UTXOSet()
        const notes: string = "AVM UTXOSet"
        const serialized: Serialized = serialization.serialize(
          utxoset,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("UTXOSet")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()
        expect(serialized.fields["utxos"]).toStrictEqual({})
        expect(serialized.fields["addressUTXOs"]).toStrictEqual({})

        serialization.deserialize(serialized, utxoset2)
        expect(utxoset2.getTypeName()).toBe("UTXOSet")
        expect(utxoset2.getTypeID()).toBeUndefined()
        expect(utxoset2.getCodecID()).toBeUndefined()
        expect(utxoset2.getAllUTXOs()).toStrictEqual([])
        expect(utxoset2.getAllUTXOStrings()).toStrictEqual([])
        expect(utxoset2.getAddresses()).toStrictEqual([])
      })

      test("Address", (): void => {
        const bsize: string = "00000014"
        const address: Address = new Address()
        const address2: Address = new Address()
        const notes: string = "Address"
        const serialized: Serialized = serialization.serialize(
          address,
          vm,
          hex,
          notes
        )
        expect(serialized.vm).toBe(vm)
        expect(serialized.encoding).toBe(hex)
        expect(serialized.notes).toBe(notes)
        expect(serialized.fields["_typeName"]).toBe("Address")
        expect(serialized.fields["_typeID"]).toBeNull()
        expect(serialized.fields["_codecID"]).toBeNull()
        expect(serialized.fields["bsize"]).toBe(bsize)
        expect(serialized.fields["bytes"]).toBe(bytes)

        serialization.deserialize(serialized, address2)
        expect(address2.getTypeName()).toBe("Address")
        expect(address2.getTypeID()).toBeUndefined()
        expect(address2.getCodecID()).toBeUndefined()
        expect(address2.toBuffer().toString(hex)).toBe(
          address.toBuffer().toString(hex)
        )
        expect(address2.toString()).toBe(address.toString())
      })
    })
  })
})
