import { Buffer } from "buffer/"
import BinTools from "../../../utils/bintools"
import { Serialization, SerializedEncoding } from "../../../utils/serialization"
import { NBytes } from "../../../common"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

export class VoteOption extends NBytes {
  protected _typeName = "VoteOption"
  protected _typeID = undefined

  //serialize and deserialize both are inherited

  protected bytes = Buffer.alloc(8)
  protected bsize = 8

  clone(): this {
    let newbase: VoteOption = new VoteOption()
    newbase.fromBuffer(this.toBuffer())
    return newbase as this
  }

  create(): this {
    return new VoteOption() as this
  }

  /**
   * VoteOption for a [[Tx]]
   */
  constructor() {
    super()
  }
}

export abstract class EssentialProposal {
  protected start: Buffer = Buffer.alloc(8)
  protected end: Buffer = Buffer.alloc(8)
  protected options: VoteOption[] // TODO: define in each Proposal separatelly
  protected numOptions: Buffer = Buffer.alloc(4)

  constructor(start?: Buffer, end?: Buffer) {
    this.start = start
    this.end = end
    this.options = []
  }

  getStart() {
    return this.start
  }

  getEnd() {
    return this.end
  }

  getOptions() {
    return this.options
  }

  /**
   * Adds a option to the proposal and returns the index off the added option.
   */
  addOption(option: VoteOption): number {
    this.options.push(option)
    if (this.options) {
      this.numOptions.writeUInt32BE(this.options.length, 0)
    }
    return this.options.length - 1
  }

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields = {
      start: serialization.encoder(this.start, encoding, "Buffer", "number"),
      end: serialization.encoder(this.end, encoding, "Buffer", "number"),
      options: this.options.map((opt) => opt.serialize(encoding))
    }
    return fields
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
    this.numOptions.writeUInt32BE(this.options.length, 0)
    this.options = fields["options"].map((opt) =>
      new VoteOption().deserialize(opt, encoding)
    )

    return this
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.numOptions = bintools.copyFrom(bytes, offset, offset + 4) // this.numOptions.readUInt32BE(0)
    offset += 4
    const optionCount = this.numOptions.readUInt32BE(0)
    this.options = []
    for (let i = 0; i < optionCount; i++) {
      const option = new VoteOption()
      offset = option.fromBuffer(bytes, offset)
      this.options.push(option)
    }
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
    const barr: Buffer[] = [this.numOptions]
    let bsize: number = this.numOptions.length

    this.options.forEach((opt) => {
      bsize += opt.getSize()
      barr.push(opt.toBuffer())
    })

    barr.push(this.start, this.end)
    bsize += this.start.length + this.end.length

    return Buffer.concat(barr, bsize)
  }
}
