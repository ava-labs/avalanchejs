import { Buffer } from "buffer/"
import { PlatformVMConstants } from "../constants"
import { EssentialProposal, VoteOption } from "./essentialproposal"

export class BaseFeeProposal extends EssentialProposal {
  private readonly _typeID = PlatformVMConstants.BASEFEEPORPOSAL_TYPE_ID
  constructor(start?: number, end?: number) {
    const startTime = Buffer.alloc(8)
    startTime.writeUInt32BE(start, 4)
    const endTime = Buffer.alloc(8)
    endTime.writeUInt32BE(end, 4)
    super(startTime, endTime)
  }

  getTypeID(): number {
    return this._typeID
  }

  addBaseFeeOption(option: number): number {
    const optionBuf = Buffer.alloc(8)
    optionBuf.writeUInt32BE(option, 4)
    const voteOption = new VoteOption()
    voteOption.fromBuffer(optionBuf)
    return super.addOption(voteOption)
  }
}
