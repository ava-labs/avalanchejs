/**
 * @packageDocumentation
 * @module API-PlatformVM-SubnetAuth
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { Serializable, SerializedEncoding } from "../../utils"
import { PlatformVMConstants } from "."

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

export class SubnetAuth extends Serializable {
  protected _typeName = "SubnetAuth"
  protected _typeID = PlatformVMConstants.SUBNETAUTH

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
  }

  /**
   * Add an address index for Subnet Auth signing
   *
   * @param index the Buffer of the address index to add
   */
  addAddressIndex(index: Buffer): void {
    this.addressIndices.push(index)
    this.numAddressIndices.writeUIntBE(this.addressIndices.length, 0, 4)
  }

  /**
   * Returns the number of address indices as a number
   */
  getNumAddressIndices(): number {
    return this.numAddressIndices.readUIntBE(0, 4)
  }

  /**
   * Returns an array of AddressIndices as Buffers
   */
  getAddressIndices(): Buffer[] {
    return this.addressIndices
  }

  /**
   * Set an array of AddressIndices as Buffers
   */
  setAddressIndices(addressIndices: Buffer[]) {
    this.addressIndices = addressIndices
    this.numAddressIndices.writeUIntBE(this.addressIndices.length, 0, 4)
  }

  protected addressIndices: Buffer[] = []
  protected numAddressIndices: Buffer = Buffer.alloc(4)

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    // increase offset for type id
    offset += 4
    this.numAddressIndices = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    this.addressIndices = []
    for (let i: number = 0; i < this.getNumAddressIndices(); i++) {
      this.addressIndices.push(bintools.copyFrom(bytes, offset, offset + 4))
      offset += 4
    }
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[SubnetAuth]].
   */
  toBuffer(): Buffer {
    const typeIDBuf: Buffer = Buffer.alloc(4)
    typeIDBuf.writeUIntBE(this._typeID, 0, 4)
    const numAddressIndices: Buffer = Buffer.alloc(4)
    numAddressIndices.writeIntBE(this.addressIndices.length, 0, 4)
    const barr: Buffer[] = [typeIDBuf, numAddressIndices]
    let bsize: number = typeIDBuf.length + numAddressIndices.length
    this.addressIndices.forEach((addressIndex: Buffer): void => {
      bsize += 4
      barr.push(addressIndex)
    })
    return Buffer.concat(barr, bsize)
  }
}
