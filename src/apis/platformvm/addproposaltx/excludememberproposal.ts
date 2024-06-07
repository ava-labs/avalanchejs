import { Buffer } from "buffer/"
import BinTools from "../../../utils/bintools"
import { Serialization, SerializedEncoding } from "../../../utils/serialization"
import { PlatformVMConstants } from "../constants"
import { EssentialProposal } from "./essentialproposal"

const serialization = Serialization.getInstance()
const bintools = BinTools.getInstance()

export class ExcludeMemberProposal extends EssentialProposal {
  private readonly _typeID = PlatformVMConstants.EXCLUDEMEMBERPORPOSAL_TYPE_ID

  serialize(encoding: SerializedEncoding = "hex"): object {
    return {
      start: serialization.encoder(this.start, encoding, "Buffer", "number"),
      end: serialization.encoder(this.end, encoding, "Buffer", "number"),
      memberAddress: serialization.encoder(
        this.memberAddress,
        encoding,
        "Buffer",
        "cb58"
      )
    }
  }

  deserialize(fields: object, encoding: SerializedEncoding = "hex"): this {
    this.start = serialization.decoder(
      fields["start"],
      encoding,
      "number",
      "Buffer"
    )
    this.end = serialization.decoder(
      fields["end"],
      encoding,
      "number",
      "Buffer"
    )
    this.memberAddress = serialization.decoder(
      fields["memberAddress"],
      encoding,
      "cb58",
      "Buffer",
      20
    )

    return this
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.memberAddress = bintools.copyFrom(bytes, offset, offset + 20)
    offset += 20
    this.start = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8
    this.end = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[BaseProposal]].
   */
  toBuffer(): Buffer {
    const barr: Buffer[] = [this.memberAddress, this.start, this.end]
    const bsize =
      this.memberAddress.length + this.start.length + this.end.length
    return Buffer.concat(barr, bsize)
  }

  constructor(start?: number, end?: number, memberAddress?: string | Buffer) {
    const startTime = Buffer.alloc(8)
    startTime.writeUInt32BE(start, 4)
    const endTime = Buffer.alloc(8)
    endTime.writeUInt32BE(end, 4)
    super(startTime, endTime)

    if (typeof memberAddress === "string") {
      this.memberAddress = bintools.stringToAddress(memberAddress)
    } else {
      this.memberAddress = memberAddress
    }
  }

  protected memberAddress = Buffer.alloc(20)

  getTypeID(): number {
    return this._typeID
  }

  getMemberAddress(): Buffer {
    return this.memberAddress
  }
}
