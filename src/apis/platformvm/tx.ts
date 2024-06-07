/**
 * @packageDocumentation
 * @module API-PlatformVM-Transactions
 */
import { Buffer } from "buffer/"
import createHash from "create-hash"
import {
  MultisigKeyChain,
  SignerKeyChain,
  SignerKeyPair,
  StandardTx,
  StandardUnsignedTx
} from "../../common"
import { Credential } from "../../common/credentials"
import BinTools from "../../utils/bintools"
import { TransactionError } from "../../utils/errors"
import { SerializedEncoding } from "../../utils/serialization"
import { AddDepositOfferTx } from "./adddepositoffertx"
import { AddProposalTx } from "./addproposaltx"
import { AddressStateTx } from "./addressstatetx"
import { AddSubnetValidatorTx } from "./addsubnetvalidatortx"
import { AddVoteTx } from "./addvotetx"
import { BaseTx } from "./basetx"
import { ClaimTx } from "./claimtx"
import { PlatformVMConstants } from "./constants"
import { CreateSubnetTx } from "./createsubnettx"
import { SelectCredentialClass } from "./credentials"
import { DepositTx } from "./depositTx"
import { ExportTx } from "./exporttx"
import { ImportTx } from "./importtx"
import { MultisigAliasTx } from "./multisigaliastx"
import { RegisterNodeTx } from "./registernodetx"
import {
  AddDelegatorTx,
  AddValidatorTx,
  CaminoAddValidatorTx
} from "./validationtx"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

/**
 * Takes a buffer representing the output and returns the proper [[BaseTx]] instance.
 *
 * @param txtype The id of the transaction type
 *
 * @returns An instance of an [[BaseTx]]-extended class.
 */
export const SelectTxClass = (txtype: number, ...args: any[]): BaseTx => {
  if (txtype === PlatformVMConstants.BASETX) {
    return new BaseTx(...args)
  } else if (txtype === PlatformVMConstants.IMPORTTX) {
    return new ImportTx(...args)
  } else if (txtype === PlatformVMConstants.EXPORTTX) {
    return new ExportTx(...args)
  } else if (txtype === PlatformVMConstants.ADDDELEGATORTX) {
    return new AddDelegatorTx(...args)
  } else if (txtype === PlatformVMConstants.ADDVALIDATORTX) {
    return new AddValidatorTx(...args)
  } else if (txtype === PlatformVMConstants.CAMINOADDVALIDATORTX) {
    return new CaminoAddValidatorTx(...args)
  } else if (txtype === PlatformVMConstants.CREATESUBNETTX) {
    return new CreateSubnetTx(...args)
  } else if (txtype === PlatformVMConstants.ADDSUBNETVALIDATORTX) {
    return new AddSubnetValidatorTx(...args)
  } else if (txtype === PlatformVMConstants.REGISTERNODETX) {
    return new RegisterNodeTx(...args)
  } else if (txtype === PlatformVMConstants.DEPOSITTX) {
    return new DepositTx(...args)
  } else if (txtype === PlatformVMConstants.ADDRESSSTATETX) {
    return new AddressStateTx(...args)
  } else if (txtype === PlatformVMConstants.CLAIMTX) {
    return new ClaimTx(...args)
  } else if (txtype === PlatformVMConstants.MULTISIGALIASTX) {
    return new MultisigAliasTx(...args)
  } else if (txtype === PlatformVMConstants.ADDDEPOSITOFFERTX) {
    return new AddDepositOfferTx(...args)
  } else if (txtype === PlatformVMConstants.ADDPROPOSALTX) {
    return new AddProposalTx(...args)
  } else if (txtype === PlatformVMConstants.ADDVOTETX) {
    return new AddVoteTx(...args)
  }
  /* istanbul ignore next */
  throw new TransactionError("Error - SelectTxClass: unknown txtype")
}

export class UnsignedTx extends StandardUnsignedTx<
  SignerKeyPair,
  SignerKeyChain,
  BaseTx
> {
  protected _typeName = "UnsignedTx"
  protected _typeID = undefined

  //serialize is inherited

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.transaction = SelectTxClass(fields["transaction"]["_typeID"])
    this.transaction.deserialize(fields["transaction"], encoding)
  }

  getTransaction(): BaseTx {
    return this.transaction as BaseTx
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.codecID = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0)
    offset += 2
    const txtype: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.transaction = SelectTxClass(txtype)
    return this.transaction.fromBuffer(bytes, offset)
  }

  /**
   * Signs this [[UnsignedTx]] and returns signed [[StandardTx]]
   *
   * @param kc An [[KeyChain]] used in signing
   *
   * @returns A signed [[StandardTx]]
   */
  sign(kc: SignerKeyChain): Tx {
    const txbuff = this.toBuffer()
    const msg: Buffer = Buffer.from(
      createHash("sha256").update(txbuff).digest()
    )

    const creds: Credential[] =
      kc instanceof MultisigKeyChain
        ? kc.getCredentials()
        : this.transaction.sign(msg, kc)
    return new Tx(this, creds)
  }
}

export class Tx extends StandardTx<SignerKeyPair, SignerKeyChain, UnsignedTx> {
  protected _typeName = "Tx"
  protected _typeID = undefined

  //serialize is inherited

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.unsignedTx = new UnsignedTx()
    this.unsignedTx.deserialize(fields["unsignedTx"], encoding)
    this.credentials = []
    for (let i: number = 0; i < fields["credentials"].length; i++) {
      const cred: Credential = SelectCredentialClass(
        fields["credentials"][`${i}`]["_typeID"]
      )
      cred.deserialize(fields["credentials"][`${i}`], encoding)
      this.credentials.push(cred)
    }
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[Tx]], parses it, populates the class, and returns the length of the Tx in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[Tx]]
   * @param offset A number representing the starting point of the bytes to begin parsing
   *
   * @returns The length of the raw [[Tx]]
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.unsignedTx = new UnsignedTx()
    offset = this.unsignedTx.fromBuffer(bytes, offset)
    const numcreds: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.credentials = []
    for (let i: number = 0; i < numcreds; i++) {
      const credid: number = bintools
        .copyFrom(bytes, offset, offset + 4)
        .readUInt32BE(0)
      offset += 4
      const cred: Credential = SelectCredentialClass(credid)
      offset = cred.fromBuffer(bytes, offset)
      this.credentials.push(cred)
    }
    return offset
  }
}
