/**
 * @packageDocumentation
 * @module API-PlatformVM-UTXOs
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import BN from "bn.js";
import { AmountOutput, SelectOutputClass, TransferableOutput, SECPOwnerOutput, ParseableOutput, StakeableLockOut, SECPTransferOutput } from './outputs';
import { AmountInput, SECPTransferInput, StakeableLockIn, TransferableInput, ParseableInput } from './inputs';
import { UnixNow } from '../../utils/helperfunctions';
import { StandardUTXO, StandardUTXOSet } from '../../common/utxos';
import { PlatformVMConstants } from './constants';
import { UnsignedTx } from './tx';
import { ExportTx } from '../platformvm/exporttx';
import { DefaultNetworkID, Defaults } from '../../utils/constants';
import { ImportTx } from '../platformvm/importtx';
import { BaseTx } from '../platformvm/basetx';
import { StandardAssetAmountDestination, AssetAmount } from '../../common/assetamount';
import { Output } from '../../common/output';
import { AddDelegatorTx, AddValidatorTx } from './validationtx';
import { CreateSubnetTx } from './createsubnettx';
import { Serialization, SerializedEncoding } from '../../utils/serialization';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();
const serializer = Serialization.getInstance();

/**
 * Class for representing a single UTXO.
 */
export class UTXO extends StandardUTXO {
  protected _typeName = "UTXO";
  protected _typeID = undefined;

  //serialize is inherited

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding);
    this.output = SelectOutputClass(fields["output"]["_typeID"]);
    this.output.deserialize(fields["output"], encoding);
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.codecid = bintools.copyFrom(bytes, offset, offset + 2);
    offset += 2;
    this.txid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    this.assetid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    const outputid: number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.output = SelectOutputClass(outputid);
    return this.output.fromBuffer(bytes, offset);
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
    return this.fromBuffer(bintools.cb58Decode(serialized));
  }

  /**
   * Returns a base-58 representation of the [[UTXO]].
   *
   * @remarks
   * unlike most toStrings, this returns in cb58 serialization format
   */
  toString(): string {
    /* istanbul ignore next */
    return bintools.cb58Encode(this.toBuffer());
  }

  clone(): this {
    const utxo: UTXO = new UTXO();
    utxo.fromBuffer(this.toBuffer());
    return utxo as this;
  }

  create(
    codecID: number = PlatformVMConstants.LATESTCODEC,
    txid: Buffer = undefined,
    outputidx: Buffer | number = undefined,
    assetid: Buffer = undefined,
    output: Output = undefined): this {
    return new UTXO(codecID, txid, outputidx, assetid, output) as this;
  }

}

export class AssetAmountDestination extends StandardAssetAmountDestination<TransferableOutput, TransferableInput> { }

/**
 * Class representing a set of [[UTXO]]s.
 */
export class UTXOSet extends StandardUTXOSet<UTXO>{
  protected _typeName = "UTXOSet";
  protected _typeID = undefined;

  //serialize is inherited

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding);
    let utxos = {};
    for (let utxoid in fields["utxos"]) {
      let utxoidCleaned: string = serializer.decoder(utxoid, encoding, "base58", "base58");
      utxos[utxoidCleaned] = new UTXO();
      utxos[utxoidCleaned].deserialize(fields["utxos"][utxoid], encoding);
    }
    let addressUTXOs = {};
    for (let address in fields["addressUTXOs"]) {
      let addressCleaned: string = serializer.decoder(address, encoding, "cb58", "hex");
      let utxobalance = {};
      for (let utxoid in fields["addressUTXOs"][address]) {
        let utxoidCleaned: string = serializer.decoder(utxoid, encoding, "base58", "base58");
        utxobalance[utxoidCleaned] = serializer.decoder(fields["addressUTXOs"][address][utxoid], encoding, "decimalString", "BN");
      }
      addressUTXOs[addressCleaned] = utxobalance;
    }
    this.utxos = utxos;
    this.addressUTXOs = addressUTXOs;
  }

  parseUTXO(utxo: UTXO | string): UTXO {
    const utxovar: UTXO = new UTXO();
    // force a copy
    if (typeof utxo === 'string') {
      utxovar.fromBuffer(bintools.cb58Decode(utxo));
    } else if (utxo instanceof StandardUTXO) {
      utxovar.fromBuffer(utxo.toBuffer()); // forces a copy
    } else {
      /* istanbul ignore next */
      throw new Error(`Error - UTXO.parseUTXO: utxo parameter is not a UTXO or string: ${utxo}`);
    }
    return utxovar
  }

  create(...args: any[]): this {
    return new UTXOSet() as this;
  }

  clone(): this {
    const newset: UTXOSet = this.create();
    const allUTXOs: Array<UTXO> = this.getAllUTXOs();
    newset.addArray(allUTXOs)
    return newset as this;
  }

  _feeCheck(fee: BN, feeAssetID: Buffer): boolean {
    return (typeof fee !== "undefined" &&
      typeof feeAssetID !== "undefined" &&
      fee.gt(new BN(0)) && feeAssetID instanceof Buffer
    );
  }

  getConsumableUXTO = (asOf: BN = UnixNow(), stakeable: boolean = false): UTXO[] => {
    return this.getAllUTXOs().filter((utxo: UTXO) => {
      if (stakeable) {
        // stakeable transactions can consume any UTXO.
        return true;
      }
      const output: Output = utxo.getOutput();
      if (!(output instanceof StakeableLockOut)) {
        // non-stakeable transactions can consume any UTXO that isn't locked.
        return true;
      }
      const stakeableOutput: StakeableLockOut = output as StakeableLockOut;
      if (stakeableOutput.getStakeableLocktime().lt(asOf)) {
        // If the stakeable outputs locktime has ended, then this UTXO can still
        // be consumed by a non-stakeable transaction.
        return true;
      }
      // This output is locked and can't be consumed by a non-stakeable
      // transaction.
      return false;
    });
  }

  getMinimumSpendable = (
    aad: AssetAmountDestination,
    asOf: BN = UnixNow(),
    locktime: BN = new BN(0),
    threshold: number = 1,
    stakeable: boolean = false,
  ): Error => {
    let utxoArray: UTXO[] = this.getConsumableUXTO(asOf, stakeable);
    let tmpUTXOArray: UTXO[] = [];
    if(stakeable) {
      // If this is a stakeable transaction then have StakeableLockOut come before SECPTransferOutput
      // so that users first stake locked tokens before staking unlocked tokens
      utxoArray.forEach((utxo: UTXO) => {
        // StakeableLockOuts
        if(utxo.getOutput().getTypeID() === 22) {
          tmpUTXOArray.push(utxo);
        }
      })

      // Sort the StakeableLockOuts by StakeableLocktime so that the greatest StakeableLocktime are spent first
      tmpUTXOArray.sort((a: UTXO, b: UTXO) => {
        let stakeableLockOut1 = a.getOutput() as StakeableLockOut;
        let stakeableLockOut2 = b.getOutput() as StakeableLockOut;
        return stakeableLockOut2.getStakeableLocktime().toNumber() - stakeableLockOut1.getStakeableLocktime().toNumber()
      })

      utxoArray.forEach((utxo: UTXO) => {
        // SECPTransferOutputs
        if(utxo.getOutput().getTypeID() === 7) {
          tmpUTXOArray.push(utxo);
        }
      })
      utxoArray = tmpUTXOArray;
    }

    // outs is a map from assetID to a tuple of (lockedStakeable, unlocked)
    // which are arrays of outputs.
    const outs: object = {};

    // We only need to iterate over UTXOs until we have spent sufficient funds
    // to met the requested amounts.
    utxoArray.forEach((utxo: UTXO, index: number) => {
      const assetID: Buffer = utxo.getAssetID();
      const assetKey: string = assetID.toString("hex");
      const fromAddresses: Buffer[] = aad.getSenders();
      const output: Output = utxo.getOutput();
      if (!(output instanceof AmountOutput) || !aad.assetExists(assetKey) || !output.meetsThreshold(fromAddresses, asOf)) {
        // We should only try to spend fungible assets.
        // We should only spend {{ assetKey }}.
        // We need to be able to spend the output.
        return;
      }

      const assetAmount: AssetAmount = aad.getAssetAmount(assetKey);
      if (assetAmount.isFinished()) {
        // We've already spent the needed UTXOs for this assetID.
        return;
      }

      if (!(assetKey in outs)) {
        // If this is the first time spending this assetID, we need to
        // initialize the outs object correctly.
        outs[assetKey] = {
          lockedStakeable: [],
          unlocked: [],
        };
      }

      const amountOutput: AmountOutput = output as AmountOutput;
      // amount is the amount of funds available from this UTXO.
      const amount = amountOutput.getAmount();

      // Set up the SECP input with the same amount as the output.
      let input: AmountInput = new SECPTransferInput(amount);

      let locked: boolean = false;
      if (amountOutput instanceof StakeableLockOut) {
        const stakeableOutput: StakeableLockOut = amountOutput as StakeableLockOut;
        const stakeableLocktime: BN = stakeableOutput.getStakeableLocktime();

        if (stakeableLocktime.gt(asOf)) {
          // Add a new input and mark it as being locked.
          input = new StakeableLockIn(
            amount,
            stakeableLocktime,
            new ParseableInput(input),
          );

          // Mark this UTXO as having been re-locked.
          locked = true;
        }
      }

      assetAmount.spendAmount(amount, locked);
      if (locked) {
        // Track the UTXO as locked.
        outs[assetKey].lockedStakeable.push(amountOutput);
      } else {
        // Track the UTXO as unlocked.
        outs[assetKey].unlocked.push(amountOutput);
      }

      // Get the indices of the outputs that should be used to authorize the
      // spending of this input.

      // TODO: getSpenders should return an array of indices rather than an
      // array of addresses.
      const spenders: Array<Buffer> = amountOutput.getSpenders(fromAddresses, asOf);
      spenders.forEach((spender: Buffer) => {
        const idx: number = amountOutput.getAddressIdx(spender);
        if (idx === -1) {
          // This should never happen, which is why the error is thrown rather
          // than being returned. If this were to ever happen this would be an
          // error in the internal logic rather having called this function with
          // invalid arguments.

          /* istanbul ignore next */
          throw new Error('Error - UTXOSet.getMinimumSpendable: no such '
            + `address in output: ${spender}`);
        }
        input.addSignatureIdx(idx, spender);
      })

      const txID: Buffer = utxo.getTxID();
      const outputIdx: Buffer = utxo.getOutputIdx();
      const transferInput: TransferableInput = new TransferableInput(
        txID,
        outputIdx,
        assetID,
        input,
      );
      aad.addInput(transferInput);
    });

    if (!aad.canComplete()) {
      // After running through all the UTXOs, we still weren't able to get all
      // the necessary funds, so this transaction can't be made.
      return new Error('Error - UTXOSet.getMinimumSpendable: insufficient '
        + 'funds to create the transaction');
    }

    // TODO: We should separate the above functionality into a single function
    // that just selects the UTXOs to consume.

    const zero: BN = new BN(0);

    // assetAmounts is an array of asset descriptions and how much is left to
    // spend for them.
    const assetAmounts: Array<AssetAmount> = aad.getAmounts();
    assetAmounts.forEach((assetAmount: AssetAmount) => {
      // change is the amount that should be returned back to the source of the
      // funds.
      const change: BN = assetAmount.getChange();
      // isStakeableLockChange is if the change is locked or not.
      const isStakeableLockChange: boolean = assetAmount.getStakeableLockChange();
      // lockedChange is the amount of locked change that should be returned to
      // the sender
      const lockedChange: BN = isStakeableLockChange ? change : zero.clone();

      const assetID: Buffer = assetAmount.getAssetID();
      const assetKey: string = assetAmount.getAssetIDString();
      const lockedOutputs: Array<StakeableLockOut> = outs[assetKey].lockedStakeable;
      lockedOutputs.forEach((lockedOutput: StakeableLockOut, i: number) => {
        const stakeableLocktime: BN = lockedOutput.getStakeableLocktime();
        const parseableOutput: ParseableOutput = lockedOutput.getTransferableOutput();

        // We know that parseableOutput contains an AmountOutput because the
        // first loop filters for fungible assets.
        const output: AmountOutput = parseableOutput.getOutput() as AmountOutput;

        let outputAmountRemaining: BN = output.getAmount();
        // The only output that could generate change is the last output.
        // Otherwise, any further UTXOs wouldn't have needed to be spent.
        if (i == lockedOutputs.length - 1 && lockedChange.gt(zero)) {
          // update outputAmountRemaining to no longer hold the change that we
          // are returning.
          outputAmountRemaining = outputAmountRemaining.sub(lockedChange);
          // Create the inner output.
          const newChangeOutput: AmountOutput = SelectOutputClass(
            output.getOutputID(),
            lockedChange,
            output.getAddresses(),
            output.getLocktime(),
            output.getThreshold(),
          ) as AmountOutput;
          // Wrap the inner output in the StakeableLockOut wrapper.
          let newLockedChangeOutput: StakeableLockOut = SelectOutputClass(
            lockedOutput.getOutputID(),
            lockedChange,
            output.getAddresses(),
            output.getLocktime(),
            output.getThreshold(),
            stakeableLocktime,
            new ParseableOutput(newChangeOutput),
          ) as StakeableLockOut;
          const transferOutput: TransferableOutput = new TransferableOutput(assetID, newLockedChangeOutput);
          aad.addChange(transferOutput);
        }

        // We know that outputAmountRemaining > 0. Otherwise, we would never
        // have consumed this UTXO, as it would be only change.

        // Create the inner output.
        const newOutput: AmountOutput = SelectOutputClass(
          output.getOutputID(),
          outputAmountRemaining,
          output.getAddresses(),
          output.getLocktime(),
          output.getThreshold(),
        ) as AmountOutput;
        // Wrap the inner output in the StakeableLockOut wrapper.
        const newLockedOutput: StakeableLockOut = SelectOutputClass(
          lockedOutput.getOutputID(),
          outputAmountRemaining,
          output.getAddresses(),
          output.getLocktime(),
          output.getThreshold(),
          stakeableLocktime,
          new ParseableOutput(newOutput),
        ) as StakeableLockOut;
        const transferOutput: TransferableOutput = new TransferableOutput(assetID, newLockedOutput);
        aad.addOutput(transferOutput);
      });

      // unlockedChange is the amount of unlocked change that should be returned
      // to the sender
      const unlockedChange: BN = isStakeableLockChange ? zero.clone() : change;
      if (unlockedChange.gt(zero)) {
        const newChangeOutput: AmountOutput = new SECPTransferOutput(
          unlockedChange,
          aad.getChangeAddresses(),
          zero.clone(), // make sure that we don't lock the change output.
          1, // only require one of the changes addresses to spend this output.
        ) as AmountOutput;
        const transferOutput: TransferableOutput = new TransferableOutput(assetID, newChangeOutput);
        aad.addChange(transferOutput);
      }

      // totalAmountSpent is the total amount of tokens consumed.
      const totalAmountSpent: BN = assetAmount.getSpent();
      // stakeableLockedAmount is the total amount of locked tokens consumed.
      const stakeableLockedAmount: BN = assetAmount.getStakeableLockSpent();
      // totalUnlockedSpent is the total amount of unlocked tokens consumed.
      const totalUnlockedSpent: BN = totalAmountSpent.sub(stakeableLockedAmount);
      // amountBurnt is the amount of unlocked tokens that must be burn.
      const amountBurnt: BN = assetAmount.getBurn();
      // totalUnlockedAvailable is the total amount of unlocked tokens available
      // to be produced.
      const totalUnlockedAvailable: BN = totalUnlockedSpent.sub(amountBurnt);
      // unlockedAmount is the amount of unlocked tokens that should be sent.
      const unlockedAmount: BN = totalUnlockedAvailable.sub(unlockedChange);
      if (unlockedAmount.gt(zero)) {
        const newOutput: AmountOutput = new SECPTransferOutput(
          unlockedAmount,
          aad.getDestinations(),
          locktime,
          threshold,
        ) as AmountOutput;
        const transferOutput: TransferableOutput = new TransferableOutput(assetID, newOutput);
        aad.addOutput(transferOutput);
      }
    })
    return undefined;
  }

  /**
   * Creates an [[UnsignedTx]] wrapping a [[BaseTx]]. For more granular control, you may create your own
   * [[UnsignedTx]] wrapping a [[BaseTx]] manually (with their corresponding [[TransferableInput]]s and [[TransferableOutput]]s).
   *
   * @param networkid The number representing NetworkID of the node
   * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
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
    networkid: number,
    blockchainid: Buffer,
    amount: BN,
    assetID: Buffer,
    toAddresses: Array<Buffer>,
    fromAddresses: Array<Buffer>,
    changeAddresses: Array<Buffer> = undefined,
    fee: BN = undefined,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = UnixNow(),
    locktime: BN = new BN(0),
    threshold: number = 1
  ): UnsignedTx => {

    if (threshold > toAddresses.length) {
      /* istanbul ignore next */
      throw new Error(`Error - UTXOSet.buildBaseTx: threshold is greater than number of addresses`);
    }

    if (typeof changeAddresses === "undefined") {
      changeAddresses = toAddresses;
    }

    if (typeof feeAssetID === "undefined") {
      feeAssetID = assetID;
    }

    const zero: BN = new BN(0);

    if (amount.eq(zero)) {
      return undefined;
    }

    const aad: AssetAmountDestination = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
    if (assetID.toString("hex") === feeAssetID.toString("hex")) {
      aad.addAssetAmount(assetID, amount, fee);
    } else {
      aad.addAssetAmount(assetID, amount, zero);
      if (this._feeCheck(fee, feeAssetID)) {
        aad.addAssetAmount(feeAssetID, zero, fee);
      }
    }

    let ins: Array<TransferableInput> = [];
    let outs: Array<TransferableOutput> = [];

    const minSpendableErr: Error = this.getMinimumSpendable(aad, asOf, locktime, threshold);
    if (typeof minSpendableErr === "undefined") {
      ins = aad.getInputs();
      outs = aad.getAllOutputs();
    } else {
      throw minSpendableErr;
    }

    const baseTx: BaseTx = new BaseTx(networkid, blockchainid, outs, ins, memo);
    return new UnsignedTx(baseTx);

  };

  /**
    * Creates an unsigned ImportTx transaction.
    *
    * @param networkid The number representing NetworkID of the node
    * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
    * @param toAddresses The addresses to send the funds
    * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
    * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs. Default: toAddresses
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
    networkid: number,
    blockchainid: Buffer,
    toAddresses: Array<Buffer>,
    fromAddresses: Array<Buffer>,
    changeAddresses: Array<Buffer>,
    atomics: Array<UTXO>,
    sourceChain: Buffer = undefined,
    fee: BN = undefined,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = UnixNow(),
    locktime: BN = new BN(0),
    threshold: number = 1
  ): UnsignedTx => {
    const zero: BN = new BN(0);
    let ins: Array<TransferableInput> = [];
    let outs: Array<TransferableOutput> = [];
    if (typeof fee === "undefined") {
      fee = zero.clone();
    }

    const importIns: Array<TransferableInput> = [];
    let feepaid: BN = new BN(0);
    let feeAssetStr: string = feeAssetID.toString("hex");
    for (let i: number = 0; i < atomics.length; i++) {
      const utxo: UTXO = atomics[i];
      const assetID: Buffer = utxo.getAssetID();
      const output: AmountOutput = utxo.getOutput() as AmountOutput;
      let amt: BN = output.getAmount().clone();

      let infeeamount = amt.clone();
      let assetStr: string = assetID.toString("hex");
      if (
        typeof feeAssetID !== "undefined" &&
        fee.gt(zero) &&
        feepaid.lt(fee) &&
        assetStr === feeAssetStr
      ) {
        feepaid = feepaid.add(infeeamount);
        if (feepaid.gte(fee)) {
          infeeamount = feepaid.sub(fee);
          feepaid = fee.clone();
        } else {
          infeeamount = zero.clone();
        }
      }

      const txid: Buffer = utxo.getTxID();
      const outputidx: Buffer = utxo.getOutputIdx();
      const input: SECPTransferInput = new SECPTransferInput(amt);
      const xferin: TransferableInput = new TransferableInput(txid, outputidx, assetID, input);
      const from: Array<Buffer> = output.getAddresses();
      const spenders: Array<Buffer> = output.getSpenders(from, asOf);
      for (let j = 0; j < spenders.length; j++) {
        const idx: number = output.getAddressIdx(spenders[j]);
        if (idx === -1) {
          /* istanbul ignore next */
          throw new Error('Error - UTXOSet.buildImportTx: no such '
            + `address in output: ${spenders[j]}`);
        }
        xferin.getInput().addSignatureIdx(idx, spenders[j]);
      }
      importIns.push(xferin);
      //add extra outputs for each amount (calculated from the imported inputs), minus fees
      if (infeeamount.gt(zero)) {
        const spendout: AmountOutput = SelectOutputClass(output.getOutputID(),
          infeeamount, toAddresses, locktime, threshold) as AmountOutput;
        const xferout: TransferableOutput = new TransferableOutput(assetID, spendout);
        outs.push(xferout);
      }
    }

    // get remaining fees from the provided addresses
    let feeRemaining: BN = fee.sub(feepaid);
    if (feeRemaining.gt(zero) && this._feeCheck(feeRemaining, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
      aad.addAssetAmount(feeAssetID, zero, feeRemaining);
      const minSpendableErr: Error = this.getMinimumSpendable(aad, asOf, locktime, threshold);
      if (typeof minSpendableErr === "undefined") {
        ins = aad.getInputs();
        outs = aad.getAllOutputs();
      } else {
        throw minSpendableErr;
      }
    }

    const importTx: ImportTx = new ImportTx(networkid, blockchainid, outs, ins, memo, sourceChain, importIns);
    return new UnsignedTx(importTx);
  };

  /**
    * Creates an unsigned ExportTx transaction. 
    *
    * @param networkid The number representing NetworkID of the node
    * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
    * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
    * @param avaxAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AVAX
    * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who recieves the AVAX
    * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who owns the AVAX
    * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover of the AVAX
    * @param destinationChain Optional. A {@link https://github.com/feross/buffer|Buffer} for the chainid where to send the asset.
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
  buildExportTx = (
    networkid: number,
    blockchainid: Buffer,
    amount: BN,
    avaxAssetID: Buffer, // TODO: rename this to amountAssetID
    toAddresses: Array<Buffer>,
    fromAddresses: Array<Buffer>,
    changeAddresses: Array<Buffer> = undefined,
    destinationChain: Buffer = undefined,
    fee: BN = undefined,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = UnixNow(),
    locktime: BN = new BN(0),
    threshold: number = 1,
  ): UnsignedTx => {
    let ins: Array<TransferableInput> = [];
    let outs: Array<TransferableOutput> = [];
    let exportouts: Array<TransferableOutput> = [];

    if (typeof changeAddresses === "undefined") {
      changeAddresses = toAddresses;
    }

    const zero: BN = new BN(0);

    if (amount.eq(zero)) {
      return undefined;
    }

    if (typeof feeAssetID === "undefined") {
      feeAssetID = avaxAssetID;
    } else if (feeAssetID.toString("hex") !== avaxAssetID.toString("hex")) {
      /* istanbul ignore next */
      throw new Error('Error - UTXOSet.buildExportTx: '
        + `feeAssetID must match avaxAssetID`);
    }

    if (typeof destinationChain === "undefined") {
      destinationChain = bintools.cb58Decode(Defaults.network[networkid].X["blockchainID"]);
    }

    const aad: AssetAmountDestination = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
    if (avaxAssetID.toString("hex") === feeAssetID.toString("hex")) {
      aad.addAssetAmount(avaxAssetID, amount, fee);
    } else {
      aad.addAssetAmount(avaxAssetID, amount, zero);
      if (this._feeCheck(fee, feeAssetID)) {
        aad.addAssetAmount(feeAssetID, zero, fee);
      }
    }

    const minSpendableErr: Error = this.getMinimumSpendable(aad, asOf, locktime, threshold);
    if (typeof minSpendableErr === "undefined") {
      ins = aad.getInputs();
      outs = aad.getChangeOutputs();
      exportouts = aad.getOutputs();
    } else {
      throw minSpendableErr;
    }

    const exportTx: ExportTx = new ExportTx(networkid, blockchainid, outs, ins, memo, destinationChain, exportouts);

    return new UnsignedTx(exportTx);
  };


  /**
  * Class representing an unsigned [[AddSubnetValidatorTx]] transaction.
  *
  * @param networkid Networkid, [[DefaultNetworkID]]
  * @param blockchainid Blockchainid, default undefined
  * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees in AVAX
  * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
  * @param nodeID The node ID of the validator being added.
  * @param startTime The Unix time when the validator starts validating the Primary Network.
  * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
  * @param weight The amount of weight for this subnet validator.
  * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
  * @param feeAssetID Optional. The assetID of the fees being burned. 
  * @param memo Optional contains arbitrary bytes, up to 256 bytes
  * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
  * @param locktime Optional. The locktime field created in the resulting outputs
  * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
  * 
  * @returns An unsigned transaction created from the passed in parameters.
  */

  /* must implement later once the transaction format signing process is clearer
  buildAddSubnetValidatorTx = (
    networkid:number = DefaultNetworkID, 
    blockchainid:Buffer,
    fromAddresses:Array<Buffer>,
    changeAddresses:Array<Buffer>,
    nodeID:Buffer, 
    startTime:BN, 
    endTime:BN,
    weight:BN,
    fee:BN = undefined,
    feeAssetID:Buffer = undefined, 
    memo:Buffer = undefined, 
    asOf:BN = UnixNow()
  ):UnsignedTx => {
    let ins:Array<TransferableInput> = [];
    let outs:Array<TransferableOutput> = [];
    //let stakeOuts:Array<TransferableOutput> = [];
    
    const zero:BN = new BN(0);
    const now:BN = UnixNow();
    if (startTime.lt(now) || endTime.lte(startTime)) {
      throw new Error("UTXOSet.buildAddSubnetValidatorTx -- startTime must be in the future and endTime must come after startTime");
    }
   
    // Not implemented: Fees can be paid from importIns
    if(this._feeCheck(fee, feeAssetID)) {
      const aad:AssetAmountDestination = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
      aad.addAssetAmount(feeAssetID, zero, fee);
      const success:Error = this.getMinimumSpendable(aad, asOf);
      if(typeof success === "undefined") {
        ins = aad.getInputs();
        outs = aad.getAllOutputs();
      } else {
        throw success;
      }
    }
   
    const UTx:AddSubnetValidatorTx = new AddSubnetValidatorTx(networkid, blockchainid, outs, ins, memo, nodeID, startTime, endTime, weight);
    return new UnsignedTx(UTx);
  }
  */

  /**
  * Class representing an unsigned [[AddDelegatorTx]] transaction.
  *
  * @param networkid Networkid, [[DefaultNetworkID]]
  * @param blockchainid Blockchainid, default undefined
  * @param avaxAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AVAX
  * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} recieves the stake at the end of the staking period
  * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees and the stake
  * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the staking payment
  * @param nodeID The node ID of the validator being added.
  * @param startTime The Unix time when the validator starts validating the Primary Network.
  * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
  * @param stakeAmount A {@link https://github.com/indutny/bn.js/|BN} for the amount of stake to be delegated in nAVAX.
  * @param rewardLocktime The locktime field created in the resulting reward outputs
  * @param rewardThreshold The number of signatures required to spend the funds in the resultant reward UTXO
  * @param rewardAddresses The addresses the validator reward goes.
  * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
  * @param feeAssetID Optional. The assetID of the fees being burned. 
  * @param memo Optional contains arbitrary bytes, up to 256 bytes
  * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
  * 
  * @returns An unsigned transaction created from the passed in parameters.
  */
  buildAddDelegatorTx = (
    networkid: number = DefaultNetworkID,
    blockchainid: Buffer,
    avaxAssetID: Buffer,
    toAddresses: Array<Buffer>,
    fromAddresses: Array<Buffer>,
    changeAddresses: Array<Buffer>,
    nodeID: Buffer,
    startTime: BN,
    endTime: BN,
    stakeAmount: BN,
    rewardLocktime: BN,
    rewardThreshold: number,
    rewardAddresses: Array<Buffer>,
    fee: BN = undefined,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = UnixNow(),
  ): UnsignedTx => {
    let ins: Array<TransferableInput> = [];
    let outs: Array<TransferableOutput> = [];
    let stakeOuts: Array<TransferableOutput> = [];

    const zero: BN = new BN(0);
    const now: BN = UnixNow();
    if (startTime.lt(now) || endTime.lte(startTime)) {
      throw new Error("UTXOSet.buildAddDelegatorTx -- startTime must be in the future and endTime must come after startTime");
    }

    const aad: AssetAmountDestination = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
    if (avaxAssetID.toString("hex") === feeAssetID.toString("hex")) {
      aad.addAssetAmount(avaxAssetID, stakeAmount, fee);
    } else {
      aad.addAssetAmount(avaxAssetID, stakeAmount, zero);
      if (this._feeCheck(fee, feeAssetID)) {
        aad.addAssetAmount(feeAssetID, zero, fee);
      }
    }

    const minSpendableErr: Error = this.getMinimumSpendable(aad, asOf, undefined, undefined, true);
    if (typeof minSpendableErr === "undefined") {
      ins = aad.getInputs();
      outs = aad.getChangeOutputs();
      stakeOuts = aad.getOutputs();
    } else {
      throw minSpendableErr;
    }

    const rewardOutputOwners: SECPOwnerOutput = new SECPOwnerOutput(rewardAddresses, rewardLocktime, rewardThreshold);

    const UTx: AddDelegatorTx = new AddDelegatorTx(networkid, blockchainid, outs, ins, memo, nodeID, startTime, endTime, stakeAmount, stakeOuts, new ParseableOutput(rewardOutputOwners));
    return new UnsignedTx(UTx);
  }

  /**
    * Class representing an unsigned [[AddValidatorTx]] transaction.
    *
    * @param networkid Networkid, [[DefaultNetworkID]]
    * @param blockchainid Blockchainid, default undefined
    * @param avaxAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AVAX
    * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} recieves the stake at the end of the staking period
    * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees and the stake
    * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the staking payment
    * @param nodeID The node ID of the validator being added.
    * @param startTime The Unix time when the validator starts validating the Primary Network.
    * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
    * @param stakeAmount A {@link https://github.com/indutny/bn.js/|BN} for the amount of stake to be delegated in nAVAX.
    * @param rewardLocktime The locktime field created in the resulting reward outputs
    * @param rewardThreshold The number of signatures required to spend the funds in the resultant reward UTXO
    * @param rewardAddresses The addresses the validator reward goes.
    * @param delegationFee A number for the percentage of reward to be given to the validator when someone delegates to them. Must be between 0 and 100. 
    * @param minStake A {@link https://github.com/indutny/bn.js/|BN} representing the minimum stake required to validate on this network.
    * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
    * @param feeAssetID Optional. The assetID of the fees being burned. 
    * @param memo Optional contains arbitrary bytes, up to 256 bytes
    * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
    * 
    * @returns An unsigned transaction created from the passed in parameters.
    */
  buildAddValidatorTx = (
    networkid: number = DefaultNetworkID,
    blockchainid: Buffer,
    avaxAssetID: Buffer,
    toAddresses: Array<Buffer>,
    fromAddresses: Array<Buffer>,
    changeAddresses: Array<Buffer>,
    nodeID: Buffer,
    startTime: BN,
    endTime: BN,
    stakeAmount: BN,
    rewardLocktime: BN,
    rewardThreshold: number,
    rewardAddresses: Array<Buffer>,
    delegationFee: number,
    fee: BN = undefined,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = UnixNow(),
  ): UnsignedTx => {
    let ins: Array<TransferableInput> = [];
    let outs: Array<TransferableOutput> = [];
    let stakeOuts: Array<TransferableOutput> = [];

    const zero: BN = new BN(0);
    const now: BN = UnixNow();
    if (startTime.lt(now) || endTime.lte(startTime)) {
      throw new Error("UTXOSet.buildAddValidatorTx -- startTime must be in the future and endTime must come after startTime");
    }

    if (delegationFee > 100 || delegationFee < 0) {
      throw new Error("UTXOSet.buildAddValidatorTx -- startTime must be in the range of 0 to 100, inclusively");
    }

    const aad: AssetAmountDestination = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
    if (avaxAssetID.toString("hex") === feeAssetID.toString("hex")) {
      aad.addAssetAmount(avaxAssetID, stakeAmount, fee);
    } else {
      aad.addAssetAmount(avaxAssetID, stakeAmount, zero);
      if (this._feeCheck(fee, feeAssetID)) {
        aad.addAssetAmount(feeAssetID, zero, fee);
      }
    }

    const minSpendableErr: Error = this.getMinimumSpendable(aad, asOf, undefined, undefined, true);
    if (typeof minSpendableErr === "undefined") {
      ins = aad.getInputs();
      outs = aad.getChangeOutputs();
      stakeOuts = aad.getOutputs();
    } else {
      throw minSpendableErr;
    }

    const rewardOutputOwners: SECPOwnerOutput = new SECPOwnerOutput(rewardAddresses, rewardLocktime, rewardThreshold);

    const UTx: AddValidatorTx = new AddValidatorTx(networkid, blockchainid, outs, ins, memo, nodeID, startTime, endTime, stakeAmount, stakeOuts, new ParseableOutput(rewardOutputOwners), delegationFee);
    return new UnsignedTx(UTx);
  }

  /**
    * Class representing an unsigned [[CreateSubnetTx]] transaction.
    *
    * @param networkid Networkid, [[DefaultNetworkID]]
    * @param blockchainid Blockchainid, default undefined
    * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
    * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
    * @param subnetOwnerAddresses An array of {@link https://github.com/feross/buffer|Buffer} for the addresses to add to a subnet
    * @param subnetOwnerThreshold The number of owners's signatures required to add a validator to the network
    * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
    * @param feeAssetID Optional. The assetID of the fees being burned
    * @param memo Optional contains arbitrary bytes, up to 256 bytes
    * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
    * 
    * @returns An unsigned transaction created from the passed in parameters.
    */
  buildCreateSubnetTx = (
    networkid: number = DefaultNetworkID,
    blockchainid: Buffer,
    fromAddresses: Array<Buffer>,
    changeAddresses: Array<Buffer>,
    subnetOwnerAddresses: Array<Buffer>,
    subnetOwnerThreshold: number,
    fee: BN = undefined,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = UnixNow(),
  ): UnsignedTx => {
    const zero: BN = new BN(0);
    let ins: Array<TransferableInput> = [];
    let outs: Array<TransferableOutput> = [];

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
      aad.addAssetAmount(feeAssetID, zero, fee);
      const minSpendableErr: Error = this.getMinimumSpendable(aad, asOf, undefined, undefined);
      if (typeof minSpendableErr === "undefined") {
        ins = aad.getInputs();
        outs = aad.getAllOutputs();
      } else {
        throw minSpendableErr;
      }
    }

    const locktime: BN = new BN(0)
    const UTx: CreateSubnetTx = new CreateSubnetTx(networkid, blockchainid, outs, ins, memo, new SECPOwnerOutput(subnetOwnerAddresses, locktime, subnetOwnerThreshold));
    return new UnsignedTx(UTx);
  }

}
