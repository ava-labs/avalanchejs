import "dotenv/config"
import { Buffer } from "../../src"
import { Tx } from "../../src/apis/evm"
import { Serialization } from "../../src/utils"
import { SerializedType } from "../../src/utils"
import * as bech32 from "bech32"
import "dotenv/config"

const cb58: SerializedType = "cb58"
const serialization: Serialization = Serialization.getInstance()

const getTxData = (item: string) => {
  const txSplit = item.split("0x000000000001")
  const prefix = "0x0000"
  const txData = prefix + txSplit[1]
  return txData
}

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

const main = async (): Promise<any> => {
  const blockExtraData: string =
    "0x00000000000100000001000000010427d4b22a2a78bcddd456742caf91b56badbff985ee19aef14573e7343fd652000000000000000000000000000000000000000000000000000000000000000000000001bb900bbe1a20da4d474666b79a5fa6ce1262973300000000009dba8421e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff00000000000000370000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff000000070000000000989680000000000000000000000001000000015feaa6c211cc8376e16211a76eff1e88bad8079d000000010000000900000001f526c9a38a2da08291583bf86e5160bd8b49df585b3fc2fb57884390c673f748428c58e95c6514b9d6a27d273550c63070ab64d257798e8d07f8a208489ebb2100"
  const txData = getTxData(blockExtraData)
  const buf: Buffer = new Buffer(txData.slice(2), "hex")
  const tx: Tx = new Tx()
  tx.fromBuffer(buf)
  const txString: string = JSON.stringify(tx)
  const txToObject = JSON.parse(txString)

  let displayExportTx = () => {
    //exportTx
    let exportedTxInputs = txToObject.unsignedTx.transaction.inputs.map(
      (input) => ({
        Address: bufToHex(input.address.data),
        Amount: bufToHex(input.amount.data),
        AmountValue: "0x" + input.amountValue,
        DecimalAmountValue: fromHexToDec(input.amountValue) + " AVAX",
        AssetID: base58Encoder(input.assetID.data),
        Nonce: bufToHex(input.nonce.data),
        NonceValue: input.nonceValue,
        SignaturesCount: toHexThenDec(input.sigCount.data),
        SignaturesIDs: input.sigIdxs
      })
    )
    let exportedTxExpOutputs =
      txToObject.unsignedTx.transaction.exportedOutputs.map((out) => ({
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
      }))
    let exportedTxCredentials = txToObject.credentials.map((credential) => ({
      Type: credential._typeName,
      TypeID: credential._typeID,
      Signatures: credential.sigArray.map((signature) => ({
        Type: signature._typeName,
        Bytes: bufToHex(signature.bytes.data),
        BytesSize: signature.bsize
      }))
    }))
    let exportTx = {
      Type: txToObject._typeName,
      UnsignedTx: {
        Type: txToObject.unsignedTx._typeName,
        CodecID: txToObject.unsignedTx.codecID,
        Transaction: {
          Type: txToObject.unsignedTx.transaction._typeName,
          TypeID: txToObject.unsignedTx.transaction._typeID,
          NetworkID: toHexThenDec(
            txToObject.unsignedTx.transaction.networkID.data
          ),
          BlockchainID: base58Encoder(
            txToObject.unsignedTx.transaction.blockchainID.data
          ),
          BlockchainIDName: chainName(
            txToObject.unsignedTx.transaction.blockchainID.data
          ),
          DestinationChain: base58Encoder(
            txToObject.unsignedTx.transaction.destinationChain.data
          ),
          DestinationChainName: chainName(
            txToObject.unsignedTx.transaction.destinationChain.data
          ),
          NumberOfInputs: toHexThenDec(
            txToObject.unsignedTx.transaction.numInputs.data
          ),
          Inputs: exportedTxInputs,
          NumberOfExportedOutputs: toHexThenDec(
            txToObject.unsignedTx.transaction.numExportedOutputs.data
          ),
          ExportedOutputs: exportedTxExpOutputs
        }
      },
      Credentials: exportedTxCredentials
    }
    console.log(require("util").inspect(exportTx, true, 10))
  }

  let displayImportTx = () => {
    //importTX
    let importedTxImpInputs = txToObject.unsignedTx.transaction.importIns.map(
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
    let importedTxOutputs = txToObject.unsignedTx.transaction.outs.map(
      (out) => ({
        Address: bufToHex(out.address.data),
        Amount: bufToHex(out.amount.data),
        AmountValue: "0x" + out.amountValue,
        DecimalAmountValue: fromHexToDec(out.amountValue) + " AVAX",
        AssetID: base58Encoder(out.assetID.data)
      })
    )
    let importedTxCredentials = txToObject.credentials.map((credential) => ({
      Type: credential._typeName,
      TypeID: credential._typeID,
      Signatures: credential.sigArray.map((signature) => ({
        Type: signature._typeName,
        Bytes: bufToHex(signature.bytes.data),
        BytesSize: signature.bsize
      }))
    }))
    let importTx = {
      Type: txToObject._typeName,
      UnsignedTx: {
        Type: txToObject.unsignedTx._typeName,
        CodecID: txToObject.unsignedTx.codecID,
        Transaction: {
          Type: txToObject.unsignedTx.transaction._typeName,
          TypeID: txToObject.unsignedTx.transaction._typeID,
          NetworkID: toHexThenDec(
            txToObject.unsignedTx.transaction.networkID.data
          ),
          BlockchainID: base58Encoder(
            txToObject.unsignedTx.transaction.blockchainID.data
          ),
          BlockchainIDName: chainName(
            txToObject.unsignedTx.transaction.blockchainID.data
          ),
          SourceChain: base58Encoder(
            txToObject.unsignedTx.transaction.sourceChain.data
          ),
          SourceChainName: chainName(
            txToObject.unsignedTx.transaction.sourceChain.data
          ),
          NumberOfImportedInputs: toHexThenDec(
            txToObject.unsignedTx.transaction.numIns.data
          ),
          ImportedInputs: importedTxImpInputs,
          NumberOfOutputs: toHexThenDec(
            txToObject.unsignedTx.transaction.numOuts.data
          ),
          Outputs: importedTxOutputs
        }
      },
      Credentials: importedTxCredentials
    }
    console.log(require("util").inspect(importTx, true, 10))
  }

  txToObject.unsignedTx.transaction._typeName == "ExportTx"
    ? displayExportTx()
    : displayImportTx()
}

main()
