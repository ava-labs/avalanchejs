/**
 * @packageDocumentation
 * @module API-AVM-UTXOs
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import BN from "bn.js"
import {
  AmountOutput,
  SelectOutputClass,
  TransferableOutput,
  NFTTransferOutput,
  NFTMintOutput,
  SECPMintOutput,
  SECPTransferOutput
} from "./outputs"
import { AVMConstants } from "./constants"
import { UnsignedTx } from "./tx"
import { SECPTransferInput, TransferableInput } from "./inputs"
import {
  NFTTransferOperation,
  TransferableOperation,
  NFTMintOperation,
  SECPMintOperation
} from "./ops"
import { Output, OutputOwners } from "../../common/output"
import { UnixNow } from "../../utils/helperfunctions"
import { InitialStates } from "./initialstates"
import { MinterSet } from "./minterset"
import { StandardUTXO, StandardUTXOSet } from "../../common/utxos"
import { CreateAssetTx } from "./createassettx"
import { OperationTx } from "./operationtx"
import { BaseTx } from "./basetx"
import { ExportTx } from "./exporttx"
import { ImportTx } from "./importtx"
import { PlatformChainID } from "../../utils/constants"
import {
  StandardAssetAmountDestination,
  AssetAmount
} from "../../common/assetamount"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import {
  UTXOError,
  AddressError,
  InsufficientFundsError,
  ThresholdError,
  SECPMintOutputError
} from "../../utils/errors"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Class for representing a single UTXO.
 */
export class UTXO extends StandardUTXO {
  protected _typeName = "UTXO"
  protected _typeID = undefined

  //serialize is inherited

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.output = SelectOutputClass(fields["output"]["_typeID"])
    this.output.deserialize(fields["output"], encoding)
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.codecID = bintools.copyFrom(bytes, offset, offset + 2)
    offset += 2
    this.txid = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    this.outputidx = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    this.assetID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    const outputid: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.output = SelectOutputClass(outputid)
    return this.output.fromBuffer(bytes, offset)
  }

  /**
   * Takes a base-58 string containing a [[UTXO]], parses it, populates the class, and returns the length of the StandardUTXO in bytes.
   *
   * @param serialized A base-58 string containing a raw [[UTXO]]
   *
   * @returns The length of the raw [[UTXO]]
   *
   * @remarks
   * unlike most fromStrings, it expects the string to be serialized in cb58 format
   */
  fromString(serialized: string): number {
    /* istanbul ignore next */
    return this.fromBuffer(bintools.cb58Decode(serialized))
  }

  /**
   * Returns a base-58 representation of the [[UTXO]].
   *
   * @remarks
   * unlike most toStrings, this returns in cb58 serialization format
   */
  toString(): string {
    /* istanbul ignore next */
    return bintools.cb58Encode(this.toBuffer())
  }

  clone(): this {
    const utxo: UTXO = new UTXO()
    utxo.fromBuffer(this.toBuffer())
    return utxo as this
  }

  create(
    codecID: number = AVMConstants.LATESTCODEC,
    txid: Buffer = undefined,
    outputidx: Buffer | number = undefined,
    assetID: Buffer = undefined,
    output: Output = undefined
  ): this {
    return new UTXO(codecID, txid, outputidx, assetID, output) as this
  }
}

export class AssetAmountDestination extends StandardAssetAmountDestination<
  TransferableOutput,
  TransferableInput
> {}

/**
 * Class representing a set of [[UTXO]]s.
 */
export class UTXOSet extends StandardUTXOSet<UTXO> {
  protected _typeName = "UTXOSet"
  protected _typeID = undefined

  //serialize is inherited

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    let utxos = {}
    for (let utxoid in fields["utxos"]) {
      let utxoidCleaned: string = serialization.decoder(
        utxoid,
        encoding,
        "base58",
        "base58"
      )
      utxos[`${utxoidCleaned}`] = new UTXO()
      utxos[`${utxoidCleaned}`].deserialize(
        fields["utxos"][`${utxoid}`],
        encoding
      )
    }
    let addressUTXOs = {}
    for (let address in fields["addressUTXOs"]) {
      let addressCleaned: string = serialization.decoder(
        address,
        encoding,
        "cb58",
        "hex"
      )
      let utxobalance: {} = {}
      for (let utxoid in fields["addressUTXOs"][`${address}`]) {
        let utxoidCleaned: string = serialization.decoder(
          utxoid,
          encoding,
          "base58",
          "base58"
        )
        utxobalance[`${utxoidCleaned}`] = serialization.decoder(
          fields["addressUTXOs"][`${address}`][`${utxoid}`],
          encoding,
          "decimalString",
          "BN"
        )
      }
      addressUTXOs[`${addressCleaned}`] = utxobalance
    }
    this.utxos = utxos
    this.addressUTXOs = addressUTXOs
  }

  parseUTXO(utxo: UTXO | string): UTXO {
    const utxovar: UTXO = new UTXO()
    // force a copy
    if (typeof utxo === "string") {
      utxovar.fromBuffer(bintools.cb58Decode(utxo))
    } else if (utxo instanceof UTXO) {
      utxovar.fromBuffer(utxo.toBuffer()) // forces a copy
    } else {
      /* istanbul ignore next */
      throw new UTXOError(
        "Error - UTXO.parseUTXO: utxo parameter is not a UTXO or string"
      )
    }
    return utxovar
  }

  create(...args: any[]): this {
    return new UTXOSet() as this
  }

  clone(): this {
    const newset: UTXOSet = this.create()
    const allUTXOs: UTXO[] = this.getAllUTXOs()
    newset.addArray(allUTXOs)
    return newset as this
  }

  _feeCheck(fee: BN, feeAssetID: Buffer): boolean {
    return (
      typeof fee !== "undefined" &&
      typeof feeAssetID !== "undefined" &&
      fee.gt(new BN(0)) &&
      feeAssetID instanceof Buffer
    )
  }

  getMinimumSpendable = (
    aad: AssetAmountDestination,
    asOf: BN = UnixNow(),
    locktime: BN = new BN(0),
    threshold: number = 1
  ): Error => {
    const utxoArray: UTXO[] = this.getAllUTXOs()
    const outids: object = {}
    for (let i: number = 0; i < utxoArray.length && !aad.canComplete(); i++) {
      const u: UTXO = utxoArray[`${i}`]
      const assetKey: string = u.getAssetID().toString("hex")
      const fromAddresses: Buffer[] = aad.getSenders()
      if (
        u.getOutput() instanceof AmountOutput &&
        aad.assetExists(assetKey) &&
        u.getOutput().meetsThreshold(fromAddresses, asOf)
      ) {
        const am: AssetAmount = aad.getAssetAmount(assetKey)
        if (!am.isFinished()) {
          const uout: AmountOutput = u.getOutput() as AmountOutput
          outids[`${assetKey}`] = uout.getOutputID()
          const amount = uout.getAmount()
          am.spendAmount(amount)
          const txid: Buffer = u.getTxID()
          const outputidx: Buffer = u.getOutputIdx()
          const input: SECPTransferInput = new SECPTransferInput(amount)
          const xferin: TransferableInput = new TransferableInput(
            txid,
            outputidx,
            u.getAssetID(),
            input
          )
          const spenders: Buffer[] = uout.getSpenders(fromAddresses, asOf)
          for (let j: number = 0; j < spenders.length; j++) {
            const idx: number = uout.getAddressIdx(spenders[`${j}`])
            if (idx === -1) {
              /* istanbul ignore next */
              throw new AddressError(
                "Error - UTXOSet.getMinimumSpendable: no such " +
                  `address in output: ${spenders[`${j}`]}`
              )
            }
            xferin.getInput().addSignatureIdx(idx, spenders[`${j}`])
          }
          aad.addInput(xferin)
        } else if (
          aad.assetExists(assetKey) &&
          !(u.getOutput() instanceof AmountOutput)
        ) {
          /**
           * Leaving the below lines, not simply for posterity, but for clarification.
           * AssetIDs may have mixed OutputTypes.
           * Some of those OutputTypes may implement AmountOutput.
           * Others may not.
           * Simply continue in this condition.
           */
          /*return new Error('Error - UTXOSet.getMinimumSpendable: outputID does not '
            + `implement AmountOutput: ${u.getOutput().getOutputID}`)*/
          continue
        }
      }
    }
    if (!aad.canComplete()) {
      return new InsufficientFundsError(
        "Error - UTXOSet.getMinimumSpendable: insufficient " +
          "funds to create the transaction"
      )
    }
    const amounts: AssetAmount[] = aad.getAmounts()
    const zero: BN = new BN(0)
    for (let i: number = 0; i < amounts.length; i++) {
      const assetKey: string = amounts[`${i}`].getAssetIDString()
      const amount: BN = amounts[`${i}`].getAmount()
      if (amount.gt(zero)) {
        const spendout: AmountOutput = SelectOutputClass(
          outids[`${assetKey}`],
          amount,
          aad.getDestinations(),
          locktime,
          threshold
        ) as AmountOutput
        const xferout: TransferableOutput = new TransferableOutput(
          amounts[`${i}`].getAssetID(),
          spendout
        )
        aad.addOutput(xferout)
      }
      const change: BN = amounts[`${i}`].getChange()
      if (change.gt(zero)) {
        const changeout: AmountOutput = SelectOutputClass(
          outids[`${assetKey}`],
          change,
          aad.getChangeAddresses()
        ) as AmountOutput
        const chgxferout: TransferableOutput = new TransferableOutput(
          amounts[`${i}`].getAssetID(),
          changeout
        )
        aad.addChange(chgxferout)
      }
    }
    return undefined
  }

  /**
   * Creates an [[UnsignedTx]] wrapping a [[BaseTx]]. For more granular control, you may create your own
   * [[UnsignedTx]] wrapping a [[BaseTx]] manually (with their corresponding [[TransferableInput]]s and [[TransferableOutput]]s).
   *
   * @param networkID The number representing NetworkID of the node
   * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
   * @param amount The amount of the asset to be spent in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}.
   * @param assetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for the UTXO
   * @param toAddresses The addresses to send the funds
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs. Default: toAddresses
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned. Default: assetID
   * @param memo Optional. Contains arbitrary data, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param locktime Optional. The locktime field created in the resulting outputs
   * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   *
   */
  buildBaseTx = (
    networkID: number,
    blockchainID: Buffer,
    amount: BN,
    assetID: Buffer,
    toAddresses: Buffer[],
    fromAddresses: Buffer[],
    changeAddresses: Buffer[] = undefined,
    fee: BN = undefined,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = UnixNow(),
    locktime: BN = new BN(0),
    threshold: number = 1
  ): UnsignedTx => {
    if (threshold > toAddresses.length) {
      /* istanbul ignore next */
      throw new ThresholdError(
        "Error - UTXOSet.buildBaseTx: threshold is greater than number of addresses"
      )
    }

    if (typeof changeAddresses === "undefined") {
      changeAddresses = toAddresses
    }

    if (typeof feeAssetID === "undefined") {
      feeAssetID = assetID
    }

    const zero: BN = new BN(0)

    if (amount.eq(zero)) {
      return undefined
    }

    const aad: AssetAmountDestination = new AssetAmountDestination(
      toAddresses,
      fromAddresses,
      changeAddresses
    )
    if (assetID.toString("hex") === feeAssetID.toString("hex")) {
      aad.addAssetAmount(assetID, amount, fee)
    } else {
      aad.addAssetAmount(assetID, amount, zero)
      if (this._feeCheck(fee, feeAssetID)) {
        aad.addAssetAmount(feeAssetID, zero, fee)
      }
    }

    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    const success: Error = this.getMinimumSpendable(
      aad,
      asOf,
      locktime,
      threshold
    )
    if (typeof success === "undefined") {
      ins = aad.getInputs()
      outs = aad.getAllOutputs()
    } else {
      throw success
    }

    const baseTx: BaseTx = new BaseTx(networkID, blockchainID, outs, ins, memo)
    return new UnsignedTx(baseTx)
  }

  /**
   * Creates an unsigned Create Asset transaction. For more granular control, you may create your own
   * [[CreateAssetTX]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
   *
   * @param networkID The number representing NetworkID of the node
   * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs
   * @param initialState The [[InitialStates]] that represent the intial state of a created asset
   * @param name String for the descriptive name of the asset
   * @param symbol String for the ticker symbol of the asset
   * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVAX = 10^9 $nAVAX
   * @param mintOutputs Optional. Array of [[SECPMintOutput]]s to be included in the transaction. These outputs can be spent to mint more tokens.
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   *
   * @returns An unsigned transaction created from the passed in parameters.
   *
   */
  buildCreateAssetTx = (
    networkID: number,
    blockchainID: Buffer,
    fromAddresses: Buffer[],
    changeAddresses: Buffer[],
    initialState: InitialStates,
    name: string,
    symbol: string,
    denomination: number,
    mintOutputs: SECPMintOutput[] = undefined,
    fee: BN = undefined,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = UnixNow()
  ): UnsignedTx => {
    const zero: BN = new BN(0)
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        fromAddresses,
        fromAddresses,
        changeAddresses
      )
      aad.addAssetAmount(feeAssetID, zero, fee)
      const success: Error = this.getMinimumSpendable(aad, asOf)
      if (typeof success === "undefined") {
        ins = aad.getInputs()
        outs = aad.getAllOutputs()
      } else {
        throw success
      }
    }
    if (typeof mintOutputs !== "undefined") {
      for (let i: number = 0; i < mintOutputs.length; i++) {
        if (mintOutputs[`${i}`] instanceof SECPMintOutput) {
          initialState.addOutput(mintOutputs[`${i}`])
        } else {
          throw new SECPMintOutputError(
            "Error - UTXOSet.buildCreateAssetTx: A submitted mintOutput was not of type SECPMintOutput"
          )
        }
      }
    }

    let CAtx: CreateAssetTx = new CreateAssetTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      name,
      symbol,
      denomination,
      initialState
    )
    return new UnsignedTx(CAtx)
  }

  /**
   * Creates an unsigned Secp mint transaction. For more granular control, you may create your own
   * [[OperationTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
   *
   * @param networkID The number representing NetworkID of the node
   * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
   * @param mintOwner A [[SECPMintOutput]] which specifies the new set of minters
   * @param transferOwner A [[SECPTransferOutput]] which specifies where the minted tokens will go
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
   * @param mintUTXOID The UTXOID for the [[SCPMintOutput]] being spent to produce more tokens
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   */
  buildSECPMintTx = (
    networkID: number,
    blockchainID: Buffer,
    mintOwner: SECPMintOutput,
    transferOwner: SECPTransferOutput,
    fromAddresses: Buffer[],
    changeAddresses: Buffer[],
    mintUTXOID: string,
    fee: BN = undefined,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = UnixNow()
  ): UnsignedTx => {
    const zero: BN = new BN(0)
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        fromAddresses,
        fromAddresses,
        changeAddresses
      )
      aad.addAssetAmount(feeAssetID, zero, fee)
      const success: Error = this.getMinimumSpendable(aad, asOf)
      if (typeof success === "undefined") {
        ins = aad.getInputs()
        outs = aad.getAllOutputs()
      } else {
        throw success
      }
    }

    let ops: TransferableOperation[] = []
    let mintOp: SECPMintOperation = new SECPMintOperation(
      mintOwner,
      transferOwner
    )

    let utxo: UTXO = this.getUTXO(mintUTXOID)
    if (typeof utxo === "undefined") {
      throw new UTXOError("Error - UTXOSet.buildSECPMintTx: UTXOID not found")
    }
    if (utxo.getOutput().getOutputID() !== AVMConstants.SECPMINTOUTPUTID) {
      throw new SECPMintOutputError(
        "Error - UTXOSet.buildSECPMintTx: UTXO is not a SECPMINTOUTPUTID"
      )
    }
    let out: SECPMintOutput = utxo.getOutput() as SECPMintOutput
    let spenders: Buffer[] = out.getSpenders(fromAddresses, asOf)

    for (let j: number = 0; j < spenders.length; j++) {
      let idx: number = out.getAddressIdx(spenders[`${j}`])
      if (idx == -1) {
        /* istanbul ignore next */
        throw new Error(
          "Error - UTXOSet.buildSECPMintTx: no such address in output"
        )
      }
      mintOp.addSignatureIdx(idx, spenders[`${j}`])
    }

    let transferableOperation: TransferableOperation =
      new TransferableOperation(utxo.getAssetID(), [`${mintUTXOID}`], mintOp)
    ops.push(transferableOperation)

    let operationTx: OperationTx = new OperationTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      ops
    )
    return new UnsignedTx(operationTx)
  }

  /**
   * Creates an unsigned Create Asset transaction. For more granular control, you may create your own
   * [[CreateAssetTX]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
   *
   * @param networkID The number representing NetworkID of the node
   * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
   * @param minterSets The minters and thresholds required to mint this nft asset
   * @param name String for the descriptive name of the nft asset
   * @param symbol String for the ticker symbol of the nft asset
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param locktime Optional. The locktime field created in the resulting mint output
   *
   * @returns An unsigned transaction created from the passed in parameters.
   *
   */
  buildCreateNFTAssetTx = (
    networkID: number,
    blockchainID: Buffer,
    fromAddresses: Buffer[],
    changeAddresses: Buffer[],
    minterSets: MinterSet[],
    name: string,
    symbol: string,
    fee: BN = undefined,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = UnixNow(),
    locktime: BN = undefined
  ): UnsignedTx => {
    const zero: BN = new BN(0)
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        fromAddresses,
        fromAddresses,
        changeAddresses
      )
      aad.addAssetAmount(feeAssetID, zero, fee)
      const success: Error = this.getMinimumSpendable(aad, asOf)
      if (typeof success === "undefined") {
        ins = aad.getInputs()
        outs = aad.getAllOutputs()
      } else {
        throw success
      }
    }
    let initialState: InitialStates = new InitialStates()
    for (let i: number = 0; i < minterSets.length; i++) {
      let nftMintOutput: NFTMintOutput = new NFTMintOutput(
        i,
        minterSets[`${i}`].getMinters(),
        locktime,
        minterSets[`${i}`].getThreshold()
      )
      initialState.addOutput(nftMintOutput, AVMConstants.NFTFXID)
    }
    let denomination: number = 0 // NFTs are non-fungible
    let CAtx: CreateAssetTx = new CreateAssetTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      name,
      symbol,
      denomination,
      initialState
    )
    return new UnsignedTx(CAtx)
  }

  /**
   * Creates an unsigned NFT mint transaction. For more granular control, you may create your own
   * [[OperationTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
   *
   * @param networkID The number representing NetworkID of the node
   * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
   * @param owners An array of [[OutputOwners]] who will be given the NFTs.
   * @param fromAddresses The addresses being used to send the funds from the UTXOs
   * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
   * @param utxoids An array of strings for the NFTs being transferred
   * @param groupID Optional. The group this NFT is issued to.
   * @param payload Optional. Data for NFT Payload.
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   *
   * @returns An unsigned transaction created from the passed in parameters.
   *
   */
  buildCreateNFTMintTx = (
    networkID: number,
    blockchainID: Buffer,
    owners: OutputOwners[],
    fromAddresses: Buffer[],
    changeAddresses: Buffer[],
    utxoids: string[],
    groupID: number = 0,
    payload: Buffer = undefined,
    fee: BN = undefined,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = UnixNow()
  ): UnsignedTx => {
    const zero: BN = new BN(0)
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        fromAddresses,
        fromAddresses,
        changeAddresses
      )
      aad.addAssetAmount(feeAssetID, zero, fee)
      const success: Error = this.getMinimumSpendable(aad, asOf)
      if (typeof success === "undefined") {
        ins = aad.getInputs()
        outs = aad.getAllOutputs()
      } else {
        throw success
      }
    }
    let ops: TransferableOperation[] = []

    let nftMintOperation: NFTMintOperation = new NFTMintOperation(
      groupID,
      payload,
      owners
    )

    for (let i: number = 0; i < utxoids.length; i++) {
      let utxo: UTXO = this.getUTXO(utxoids[`${i}`])
      let out: NFTTransferOutput = utxo.getOutput() as NFTTransferOutput
      let spenders: Buffer[] = out.getSpenders(fromAddresses, asOf)

      for (let j: number = 0; j < spenders.length; j++) {
        let idx: number
        idx = out.getAddressIdx(spenders[`${j}`])
        if (idx == -1) {
          /* istanbul ignore next */
          throw new AddressError(
            "Error - UTXOSet.buildCreateNFTMintTx: no such address in output"
          )
        }
        nftMintOperation.addSignatureIdx(idx, spenders[`${j}`])
      }

      let transferableOperation: TransferableOperation =
        new TransferableOperation(utxo.getAssetID(), utxoids, nftMintOperation)
      ops.push(transferableOperation)
    }

    let operationTx: OperationTx = new OperationTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      ops
    )
    return new UnsignedTx(operationTx)
  }

  /**
   * Creates an unsigned NFT transfer transaction. For more granular control, you may create your own
   * [[OperationTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
   *
   * @param networkID The number representing NetworkID of the node
   * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
   * @param toAddresses An array of {@link https://github.com/feross/buffer|Buffer}s which indicate who recieves the NFT
   * @param fromAddresses An array for {@link https://github.com/feross/buffer|Buffer} who owns the NFT
   * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
   * @param utxoids An array of strings for the NFTs being transferred
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param locktime Optional. The locktime field created in the resulting outputs
   * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   *
   */
  buildNFTTransferTx = (
    networkID: number,
    blockchainID: Buffer,
    toAddresses: Buffer[],
    fromAddresses: Buffer[],
    changeAddresses: Buffer[],
    utxoids: string[],
    fee: BN = undefined,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = UnixNow(),
    locktime: BN = new BN(0),
    threshold: number = 1
  ): UnsignedTx => {
    const zero: BN = new BN(0)
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        fromAddresses,
        fromAddresses,
        changeAddresses
      )
      aad.addAssetAmount(feeAssetID, zero, fee)
      const success: Error = this.getMinimumSpendable(aad, asOf)
      if (typeof success === "undefined") {
        ins = aad.getInputs()
        outs = aad.getAllOutputs()
      } else {
        throw success
      }
    }
    const ops: TransferableOperation[] = []
    for (let i: number = 0; i < utxoids.length; i++) {
      const utxo: UTXO = this.getUTXO(utxoids[`${i}`])

      const out: NFTTransferOutput = utxo.getOutput() as NFTTransferOutput
      const spenders: Buffer[] = out.getSpenders(fromAddresses, asOf)

      const outbound: NFTTransferOutput = new NFTTransferOutput(
        out.getGroupID(),
        out.getPayload(),
        toAddresses,
        locktime,
        threshold
      )
      const op: NFTTransferOperation = new NFTTransferOperation(outbound)

      for (let j: number = 0; j < spenders.length; j++) {
        const idx: number = out.getAddressIdx(spenders[`${j}`])
        if (idx === -1) {
          /* istanbul ignore next */
          throw new AddressError(
            "Error - UTXOSet.buildNFTTransferTx: " +
              `no such address in output: ${spenders[`${j}`]}`
          )
        }
        op.addSignatureIdx(idx, spenders[`${j}`])
      }

      const xferop: TransferableOperation = new TransferableOperation(
        utxo.getAssetID(),
        [utxoids[`${i}`]],
        op
      )
      ops.push(xferop)
    }
    const OpTx: OperationTx = new OperationTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      ops
    )
    return new UnsignedTx(OpTx)
  }

  /**
   * Creates an unsigned ImportTx transaction.
   *
   * @param networkID The number representing NetworkID of the node
   * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
   * @param toAddresses The addresses to send the funds
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
   * @param importIns An array of [[TransferableInput]]s being imported
   * @param sourceChain A {@link https://github.com/feross/buffer|Buffer} for the chainid where the imports are coming from.
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}. Fee will come from the inputs first, if they can.
   * @param feeAssetID Optional. The assetID of the fees being burned.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param locktime Optional. The locktime field created in the resulting outputs
   * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
   * @returns An unsigned transaction created from the passed in parameters.
   *
   */
  buildImportTx = (
    networkID: number,
    blockchainID: Buffer,
    toAddresses: Buffer[],
    fromAddresses: Buffer[],
    changeAddresses: Buffer[],
    atomics: UTXO[],
    sourceChain: Buffer = undefined,
    fee: BN = undefined,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = UnixNow(),
    locktime: BN = new BN(0),
    threshold: number = 1
  ): UnsignedTx => {
    const zero: BN = new BN(0)
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []
    if (typeof fee === "undefined") {
      fee = zero.clone()
    }

    const importIns: TransferableInput[] = []
    let feepaid: BN = new BN(0)
    let feeAssetStr: string = feeAssetID.toString("hex")
    for (let i: number = 0; i < atomics.length; i++) {
      const utxo: UTXO = atomics[`${i}`]
      const assetID: Buffer = utxo.getAssetID()
      const output: AmountOutput = utxo.getOutput() as AmountOutput
      let amt: BN = output.getAmount().clone()

      let infeeamount = amt.clone()
      let assetStr: string = assetID.toString("hex")
      if (
        typeof feeAssetID !== "undefined" &&
        fee.gt(zero) &&
        feepaid.lt(fee) &&
        assetStr === feeAssetStr
      ) {
        feepaid = feepaid.add(infeeamount)
        if (feepaid.gt(fee)) {
          infeeamount = feepaid.sub(fee)
          feepaid = fee.clone()
        } else {
          infeeamount = zero.clone()
        }
      }

      const txid: Buffer = utxo.getTxID()
      const outputidx: Buffer = utxo.getOutputIdx()
      const input: SECPTransferInput = new SECPTransferInput(amt)
      const xferin: TransferableInput = new TransferableInput(
        txid,
        outputidx,
        assetID,
        input
      )
      const from: Buffer[] = output.getAddresses()
      const spenders: Buffer[] = output.getSpenders(from, asOf)
      for (let j: number = 0; j < spenders.length; j++) {
        const idx: number = output.getAddressIdx(spenders[`${j}`])
        if (idx === -1) {
          /* istanbul ignore next */
          throw new AddressError(
            "Error - UTXOSet.buildImportTx: no such " +
              `address in output: ${spenders[`${j}`]}`
          )
        }
        xferin.getInput().addSignatureIdx(idx, spenders[`${j}`])
      }
      importIns.push(xferin)

      //add extra outputs for each amount (calculated from the imported inputs), minus fees
      if (infeeamount.gt(zero)) {
        const spendout: AmountOutput = SelectOutputClass(
          output.getOutputID(),
          infeeamount,
          toAddresses,
          locktime,
          threshold
        ) as AmountOutput
        const xferout: TransferableOutput = new TransferableOutput(
          assetID,
          spendout
        )
        outs.push(xferout)
      }
    }

    // get remaining fees from the provided addresses
    let feeRemaining: BN = fee.sub(feepaid)
    if (feeRemaining.gt(zero) && this._feeCheck(feeRemaining, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        toAddresses,
        fromAddresses,
        changeAddresses
      )
      aad.addAssetAmount(feeAssetID, zero, feeRemaining)
      const success: Error = this.getMinimumSpendable(
        aad,
        asOf,
        locktime,
        threshold
      )
      if (typeof success === "undefined") {
        ins = aad.getInputs()
        outs = aad.getAllOutputs()
      } else {
        throw success
      }
    }

    const importTx: ImportTx = new ImportTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      sourceChain,
      importIns
    )
    return new UnsignedTx(importTx)
  }

  /**
   * Creates an unsigned ExportTx transaction.
   *
   * @param networkID The number representing NetworkID of the node
   * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
   * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
   * @param avaxAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AVAX
   * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who recieves the AVAX
   * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who owns the AVAX
   * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param destinationChain Optional. A {@link https://github.com/feross/buffer|Buffer} for the chainid where to send the asset.
   * @param feeAssetID Optional. The assetID of the fees being burned.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param locktime Optional. The locktime field created in the resulting outputs
   * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
   * @returns An unsigned transaction created from the passed in parameters.
   *
   */
  buildExportTx = (
    networkID: number,
    blockchainID: Buffer,
    amount: BN,
    assetID: Buffer,
    toAddresses: Buffer[],
    fromAddresses: Buffer[],
    changeAddresses: Buffer[] = undefined,
    destinationChain: Buffer = undefined,
    fee: BN = undefined,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = UnixNow(),
    locktime: BN = new BN(0),
    threshold: number = 1
  ): UnsignedTx => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []
    let exportouts: TransferableOutput[] = []

    if (typeof changeAddresses === "undefined") {
      changeAddresses = toAddresses
    }

    const zero: BN = new BN(0)

    if (amount.eq(zero)) {
      return undefined
    }

    if (typeof feeAssetID === "undefined") {
      feeAssetID = assetID
    }

    if (typeof destinationChain === "undefined") {
      destinationChain = bintools.cb58Decode(PlatformChainID)
    }

    const aad: AssetAmountDestination = new AssetAmountDestination(
      toAddresses,
      fromAddresses,
      changeAddresses
    )
    if (assetID.toString("hex") === feeAssetID.toString("hex")) {
      aad.addAssetAmount(assetID, amount, fee)
    } else {
      aad.addAssetAmount(assetID, amount, zero)
      if (this._feeCheck(fee, feeAssetID)) {
        aad.addAssetAmount(feeAssetID, zero, fee)
      }
    }
    const success: Error = this.getMinimumSpendable(
      aad,
      asOf,
      locktime,
      threshold
    )
    if (typeof success === "undefined") {
      ins = aad.getInputs()
      outs = aad.getChangeOutputs()
      exportouts = aad.getOutputs()
    } else {
      throw success
    }

    const exportTx: ExportTx = new ExportTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      destinationChain,
      exportouts
    )
    return new UnsignedTx(exportTx)
  }
}
