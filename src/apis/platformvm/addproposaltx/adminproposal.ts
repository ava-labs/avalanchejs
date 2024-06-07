import { Buffer } from "buffer/"
import BinTools from "../../../utils/bintools"
import { Serialization, SerializedEncoding } from "../../../utils/serialization"
import { PlatformVMConstants } from "../constants"
import { EssentialProposal } from "./essentialproposal"
import { AddMemberProposal } from "./addmemberproposal"
import { ExcludeMemberProposal } from "./excludememberproposal"

const serialization = Serialization.getInstance()
const bintools = BinTools.getInstance()

type AllowedProposal = AddMemberProposal | ExcludeMemberProposal
export class AdminProposal extends EssentialProposal {
  private readonly _typeID = PlatformVMConstants.ADMINPROPOSAL_TYPE_ID
  private _optionIndex = Buffer.alloc(4)
  private _proposal: AllowedProposal

  constructor(optionIndex?: Buffer, proposal?: AllowedProposal) {
    super()
    this._optionIndex = optionIndex
    this._proposal = proposal
  }

  serialize(encoding: SerializedEncoding = "hex"): object {
    return {
      proposal: this._proposal.serialize(encoding),
      optionIndex: serialization.encoder(
        this._optionIndex,
        encoding,
        "Buffer",
        "number"
      )
    }
  }

  deserialize(fields: object, encoding: SerializedEncoding = "hex"): this {
    this._proposal = this._proposal.deserialize(fields, encoding)
    this._optionIndex = serialization.decoder(
      fields["optionIndex"],
      encoding,
      "number",
      "Buffer"
    )
    return this
  }

  getTypeID() {
    return this._typeID
  }

  getOptionIndex() {
    return this._optionIndex
  }

  getProposal() {
    return this._proposal
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    // try to parse addmember proposal
    this._optionIndex = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const proposalTypeID = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    switch (proposalTypeID) {
      case PlatformVMConstants.ADDMEMBERPORPOSAL_TYPE_ID:
        this._proposal = new AddMemberProposal()
        break
      case PlatformVMConstants.EXCLUDEMEMBERPORPOSAL_TYPE_ID:
        this._proposal = new ExcludeMemberProposal()
        break
      default:
        throw `Unsupported proposal type: ${proposalTypeID}`
    }
    offset = this._proposal.fromBuffer(bytes, offset)
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[BaseProposal]].
   */
  toBuffer(): Buffer {
    const buff = this.getOptionIndex()
    const typeIdBuff = Buffer.alloc(4)
    typeIdBuff.writeUInt32BE(this._proposal.getTypeID(), 0)
    const proposalBuff = this._proposal.toBuffer()
    return Buffer.concat(
      [buff, typeIdBuff, proposalBuff],
      buff.length + typeIdBuff.length + proposalBuff.length
    )
  }
}
