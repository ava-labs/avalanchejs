import "dotenv/config"
import { Avalanche, Buffer } from "../../src"
import { EVMAPI, Tx } from "../../src/apis/evm"
import { Serialization } from "../../src/utils"
import { SerializedType } from "../../src/utils"
import * as bech32 from "bech32"
import "dotenv/config"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const cchain: EVMAPI = avalanche.CChain()
const cb58: SerializedType = "cb58"
const serialization: Serialization = Serialization.getInstance()

const main = async (): Promise<any> => {
  const txID: string = "2KCUg2MxfjA4V9haakyMcCpF4TbmEYcduJwHvfHsoXPi5AMjSZ"
  const hex: string = await cchain.getAtomicTx(txID)
  const buf: Buffer = new Buffer(hex.slice(2), "hex")
  const tx: Tx = new Tx()
  tx.fromBuffer(buf)
  const jsonStr: string = JSON.stringify(tx)
  const jsn = JSON.parse(jsonStr)
  console.log("Raw:")
  console.log(jsonStr)
  console.log(jsn)
  console.log("")

  const fromDecToHex = (item: number) => {
    let hexVal = item.toString(16)
    let hexString = hexVal.length < 2 ? "0" + hexVal : hexVal
    return hexString
  }
  const fromHexToDec = (item: string) => {
    let hexString = item.split("0x").join("")
    let decNumber = parseInt(hexString, 16)
    let value = decNumber / 10 ** 9
    return value
  }
  const toHexThenDec = (item: number) => {
    let toHex = fromDecToHex(item).split(",").join("")
    let hexString = toHex.split("0x").join("")
    let decNumber = parseInt(hexString, 16)
    return decNumber
  }
  const bufToHex = (item: string) => {
    let valueFromJSON = item
    let bufValueFromJson = Buffer.from(valueFromJSON)
    let arrValueFromJSON = [...bufValueFromJson]
    let hexValueFromJSON = arrValueFromJSON.map((item) => fromDecToHex(item))
    return "0x" + hexValueFromJSON.toString().split(",").join("")
  }
  const bech32Encoder = (item: string) => {
    const hrp = "avax"
    let valueFromJSON = item
    let bufValueFromJson = Buffer.from(valueFromJSON)
    let arrValueFromJSON = [...bufValueFromJson]
    let bech32Address = bech32.bech32.encode(
      hrp,
      bech32.bech32.toWords(arrValueFromJSON)
    )
    return "C-" + bech32Address
  }
  const base58Encoder = (item: string) => {
    let valToBeEncoded = Buffer.from(item)
    let base58Val: string = serialization.bufferToType(valToBeEncoded, cb58)
    return base58Val
  }
  const chainName = (item: string) => {
    const chainID = base58Encoder(item)
    let name: string = "null"
    const cchainID = "2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5"
    const pchainID = "11111111111111111111111111111111LpoYY"
    chainID == "11111111111111111111111111111111LpoYY"
      ? (name = "P-Chain")
      : (name = "X-Chain")
    chainID == cchainID
      ? (name = "C-Chain")
      : chainID == pchainID
      ? name == "P-Chain"
      : (name = "X-Chain")
    return name
  }

  let displayExportTx = () => {
    //exportTx
    let exportedTxInputs = jsn.unsignedTx.transaction.inputs.map((input) => ({
      Address: bufToHex(input.address.data),
      Amount: bufToHex(input.amount.data),
      AmountValue: "0x" + input.amountValue,
      DecimalAmountValue: fromHexToDec(input.amountValue) + " AVAX",
      AssetID: base58Encoder(input.assetID.data),
      Nonce: bufToHex(input.nonce.data),
      NonceValue: input.nonceValue,
      SignaturesCount: toHexThenDec(input.sigCount.data),
      SignaturesIDs: input.sigIdxs
    }))
    let exportedTxExpOutputs = jsn.unsignedTx.transaction.exportedOutputs.map(
      (out) => ({
        Type: out._typeName,
        AssetID: base58Encoder(out.assetID.data),
        Output: {
          Type: out.output._typeName,
          TypeID: out.output._typeID,
          Locktime: toHexThenDec(out.output.locktime.data),
          Threshold: toHexThenDec(out.output.threshold.data),
          NumberOfAddresses: toHexThenDec(out.output.numaddrs.data),
          Addresses: out.output.addresses.map((address) => ({
            Type: address._typeName,
            Bytes: bufToHex(address.bytes.data),
            BytesSize: address.bsize,
            Bech32Format: bech32Encoder(address.bytes.data)
          })),
          Amount: bufToHex(out.output.amount),
          AmountValue: "0x" + out.output.amountValue,
          DecimalAmountValue: fromHexToDec(out.output.amountValue) + " AVAX"
        }
      })
    )
    let exportedTxCredentials = jsn.credentials.map((credential) => ({
      Type: credential._typeName,
      TypeID: credential._typeID,
      Signatures: credential.sigArray.map((signature) => ({
        Type: signature._typeName,
        Bytes: bufToHex(signature.bytes.data),
        BytesSize: signature.bsize
      }))
    }))
    let exportTx = {
      Type: jsn._typeName,
      UnsignedTx: {
        Type: jsn.unsignedTx._typeName,
        CodecID: jsn.unsignedTx.codecID,
        Transaction: {
          Type: jsn.unsignedTx.transaction._typeName,
          TypeID: jsn.unsignedTx.transaction._typeID,
          NetworkID: toHexThenDec(jsn.unsignedTx.transaction.networkID.data),
          BlockchainID: base58Encoder(
            jsn.unsignedTx.transaction.blockchainID.data
          ),
          BlockchainIDName: chainName(
            jsn.unsignedTx.transaction.blockchainID.data
          ),
          DestinationChain: base58Encoder(
            jsn.unsignedTx.transaction.destinationChain.data
          ),
          DestinationChainName: chainName(
            jsn.unsignedTx.transaction.destinationChain.data
          ),
          NumberOfInputs: toHexThenDec(
            jsn.unsignedTx.transaction.numInputs.data
          ),
          Inputs: exportedTxInputs,
          NumberOfExportedOutputs: toHexThenDec(
            jsn.unsignedTx.transaction.numExportedOutputs.data
          ),
          ExportedOutputs: exportedTxExpOutputs
        }
      },
      Credentials: exportedTxCredentials
    }
    console.log("Pretty:")
    console.log(require("util").inspect(exportTx, true, 10))
  }

  let displayImportTx = () => {
    //importTX
    let importedTxImpInputs = jsn.unsignedTx.transaction.importIns.map(
      (inp) => ({
        Type: inp._typeName,
        TransactionId: base58Encoder(inp.txid.data),
        OutputId: toHexThenDec(inp.outputidx.data),
        AssetID: base58Encoder(inp.assetID.data),
        Input: {
          Type: inp.input._typeName,
          TypeID: inp.input._typeID,
          SignaturesIds: inp.input.sigIdxs.map((signature) => ({
            Type: signature._typeName,
            Source: bufToHex(signature.source),
            Bytes: bufToHex(signature.bytes.data),
            BytesSize: signature.bsize
          })),
          Amount: bufToHex(inp.input.amount),
          AmountValue: "0x" + inp.input.amountValue,
          DecimalAmountValue: fromHexToDec(inp.input.amountValue) + " AVAX"
        }
      })
    )
    let importedTxOutputs = jsn.unsignedTx.transaction.outs.map((out) => ({
      Address: bufToHex(out.address.data),
      Amount: bufToHex(out.amount.data),
      AmountValue: "0x" + out.amountValue,
      DecimalAmountValue: fromHexToDec(out.amountValue) + " AVAX",
      AssetID: base58Encoder(out.assetID.data)
    }))
    let importedTxCredentials = jsn.credentials.map((credential) => ({
      Type: credential._typeName,
      TypeID: credential._typeID,
      Signatures: credential.sigArray.map((signature) => ({
        Type: signature._typeName,
        Bytes: bufToHex(signature.bytes.data),
        BytesSize: signature.bsize
      }))
    }))
    let importTx = {
      Type: jsn._typeName,
      UnsignedTx: {
        Type: jsn.unsignedTx._typeName,
        CodecID: jsn.unsignedTx.codecID,
        Transaction: {
          Type: jsn.unsignedTx.transaction._typeName,
          TypeID: jsn.unsignedTx.transaction._typeID,
          NetworkID: toHexThenDec(jsn.unsignedTx.transaction.networkID.data),
          BlockchainID: base58Encoder(
            jsn.unsignedTx.transaction.blockchainID.data
          ),
          BlockchainIDName: chainName(
            jsn.unsignedTx.transaction.blockchainID.data
          ),
          SourceChain: base58Encoder(
            jsn.unsignedTx.transaction.sourceChain.data
          ),
          SourceChainName: chainName(
            jsn.unsignedTx.transaction.sourceChain.data
          ),
          NumberOfImportedInputs: toHexThenDec(
            jsn.unsignedTx.transaction.numIns.data
          ),
          ImportedInputs: importedTxImpInputs,
          NumberOfOutputs: toHexThenDec(
            jsn.unsignedTx.transaction.numOuts.data
          ),
          Outputs: importedTxOutputs
        }
      },
      Credentials: importedTxCredentials
    }
    console.log("Pretty:")
    console.log(require("util").inspect(importTx, true, 10))
  }

  jsn.unsignedTx.transaction._typeName == "ExportTx"
    ? displayExportTx()
    : displayImportTx()
}

main()
