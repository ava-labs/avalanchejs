/**
 * @packageDocumentation
 * @module Utils-Serialization
 */
import BinTools from "../utils/bintools"
import BN from "bn.js"
import { Buffer } from "buffer/"
import xss from "xss"
import {
  NodeIDStringToBuffer,
  privateKeyStringToBuffer,
  bufferToNodeIDString,
  bufferToPrivateKeyString
} from "./helperfunctions"
import {
  CodecIdError,
  TypeIdError,
  TypeNameError,
  UnknownTypeError
} from "../utils/errors"
import { Serialized } from "../common"

export const SERIALIZATIONVERSION: number = 0
export type SerializedType =
  | "hex"
  | "BN"
  | "Buffer"
  | "bech32"
  | "nodeID"
  | "privateKey"
  | "cb58"
  | "base58"
  | "base64"
  | "decimalString"
  | "number"
  | "utf8"

export type SerializedEncoding =
  | "hex"
  | "cb58"
  | "base58"
  | "base64"
  | "decimalString"
  | "number"
  | "utf8"
  | "display"

export abstract class Serializable {
  protected _typeName: string = undefined
  protected _typeID: number = undefined
  protected _codecID: number = undefined

  /**
   * Used in serialization. TypeName is a string name for the type of object being output.
   */
  getTypeName(): string {
    return this._typeName
  }

  /**
   * Used in serialization. Optional. TypeID is a number for the typeID of object being output.
   */
  getTypeID(): number {
    return this._typeID
  }

  /**
   * Used in serialization. Optional. TypeID is a number for the typeID of object being output.
   */
  getCodecID(): number {
    return this._codecID
  }

  /**
   * Sanitize to prevent cross scripting attacks.
   */
  sanitizeObject(obj: object): object {
    for (const k in obj) {
      if (typeof obj[`${k}`] === "object" && obj[`${k}`] !== null) {
        this.sanitizeObject(obj[`${k}`])
      } else if (typeof obj[`${k}`] === "string") {
        obj[`${k}`] = xss(obj[`${k}`])
      }
    }
    return obj
  }

  //sometimes the parent class manages the fields
  //these are so you can say super.serialize(encoding)
  serialize(encoding?: SerializedEncoding): object {
    return {
      _typeName: xss(this._typeName),
      _typeID: typeof this._typeID === "undefined" ? null : this._typeID,
      _codecID: typeof this._codecID === "undefined" ? null : this._codecID
    }
  }
  deserialize(fields: object, encoding?: SerializedEncoding): void {
    fields = this.sanitizeObject(fields)
    if (typeof fields["_typeName"] !== "string") {
      throw new TypeNameError(
        "Error - Serializable.deserialize: _typeName must be a string, found: " +
          typeof fields["_typeName"]
      )
    }
    if (fields["_typeName"] !== this._typeName) {
      throw new TypeNameError(
        "Error - Serializable.deserialize: _typeName mismatch -- expected: " +
          this._typeName +
          " -- received: " +
          fields["_typeName"]
      )
    }
    if (
      typeof fields["_typeID"] !== "undefined" &&
      fields["_typeID"] !== null
    ) {
      if (typeof fields["_typeID"] !== "number") {
        throw new TypeIdError(
          "Error - Serializable.deserialize: _typeID must be a number, found: " +
            typeof fields["_typeID"]
        )
      }
      if (fields["_typeID"] !== this._typeID) {
        throw new TypeIdError(
          "Error - Serializable.deserialize: _typeID mismatch -- expected: " +
            this._typeID +
            " -- received: " +
            fields["_typeID"]
        )
      }
    }
    if (
      typeof fields["_codecID"] !== "undefined" &&
      fields["_codecID"] !== null
    ) {
      if (typeof fields["_codecID"] !== "number") {
        throw new CodecIdError(
          "Error - Serializable.deserialize: _codecID must be a number, found: " +
            typeof fields["_codecID"]
        )
      }
      if (fields["_codecID"] !== this._codecID) {
        throw new CodecIdError(
          "Error - Serializable.deserialize: _codecID mismatch -- expected: " +
            this._codecID +
            " -- received: " +
            fields["_codecID"]
        )
      }
    }
  }
}

export class Serialization {
  private static instance: Serialization

  private constructor() {
    this.bintools = BinTools.getInstance()
  }
  private bintools: BinTools

  /**
   * Retrieves the Serialization singleton.
   */
  static getInstance(): Serialization {
    if (!Serialization.instance) {
      Serialization.instance = new Serialization()
    }
    return Serialization.instance
  }

  /**
   * Convert {@link https://github.com/feross/buffer|Buffer} to [[SerializedType]]
   *
   * @param vb {@link https://github.com/feross/buffer|Buffer}
   * @param type [[SerializedType]]
   * @param ...args remaining arguments
   * @returns type of [[SerializedType]]
   */
  bufferToType(vb: Buffer, type: SerializedType, ...args: any[]): any {
    if (type === "BN") {
      return new BN(vb.toString("hex"), "hex")
    } else if (type === "Buffer") {
      if (args.length == 1 && typeof args[0] === "number") {
        vb = Buffer.from(vb.toString("hex").padStart(args[0] * 2, "0"), "hex")
      }
      return vb
    } else if (type === "bech32") {
      return this.bintools.addressToString(args[0], args[1], vb)
    } else if (type === "nodeID") {
      return bufferToNodeIDString(vb)
    } else if (type === "privateKey") {
      return bufferToPrivateKeyString(vb)
    } else if (type === "cb58") {
      return this.bintools.cb58Encode(vb)
    } else if (type === "base58") {
      return this.bintools.bufferToB58(vb)
    } else if (type === "base64") {
      return vb.toString("base64")
    } else if (type === "hex") {
      return vb.toString("hex")
    } else if (type === "decimalString") {
      return new BN(vb.toString("hex"), "hex").toString(10)
    } else if (type === "number") {
      return new BN(vb.toString("hex"), "hex").toNumber()
    } else if (type === "utf8") {
      return vb.toString("utf8")
    }
    return undefined
  }

  /**
   * Convert [[SerializedType]] to {@link https://github.com/feross/buffer|Buffer}
   *
   * @param v type of [[SerializedType]]
   * @param type [[SerializedType]]
   * @param ...args remaining arguments
   * @returns {@link https://github.com/feross/buffer|Buffer}
   */
  typeToBuffer(v: any, type: SerializedType, ...args: any[]): Buffer {
    if (type === "BN") {
      let str: string = (v as BN).toString("hex")
      if (args.length == 1 && typeof args[0] === "number") {
        return Buffer.from(str.padStart(args[0] * 2, "0"), "hex")
      }
      return Buffer.from(str, "hex")
    } else if (type === "Buffer") {
      return v
    } else if (type === "bech32") {
      return this.bintools.stringToAddress(v, ...args)
    } else if (type === "nodeID") {
      return NodeIDStringToBuffer(v)
    } else if (type === "privateKey") {
      return privateKeyStringToBuffer(v)
    } else if (type === "cb58") {
      return this.bintools.cb58Decode(v)
    } else if (type === "base58") {
      return this.bintools.b58ToBuffer(v)
    } else if (type === "base64") {
      return Buffer.from(v as string, "base64")
    } else if (type === "hex") {
      if ((v as string).startsWith("0x")) {
        v = (v as string).slice(2)
      }
      return Buffer.from(v as string, "hex")
    } else if (type === "decimalString") {
      let str: string = new BN(v as string, 10).toString("hex")
      if (args.length == 1 && typeof args[0] === "number") {
        return Buffer.from(str.padStart(args[0] * 2, "0"), "hex")
      }
      return Buffer.from(str, "hex")
    } else if (type === "number") {
      let str: string = new BN(v, 10).toString("hex")
      if (args.length == 1 && typeof args[0] === "number") {
        return Buffer.from(str.padStart(args[0] * 2, "0"), "hex")
      }
      return Buffer.from(str, "hex")
    } else if (type === "utf8") {
      if (args.length == 1 && typeof args[0] === "number") {
        let b: Buffer = Buffer.alloc(args[0])
        b.write(v)
        return b
      }
      return Buffer.from(v, "utf8")
    }
    return undefined
  }

  /**
   * Convert value to type of [[SerializedType]] or [[SerializedEncoding]]
   *
   * @param value
   * @param encoding [[SerializedEncoding]]
   * @param intype [[SerializedType]]
   * @param outtype [[SerializedType]]
   * @param ...args remaining arguments
   * @returns type of [[SerializedType]] or [[SerializedEncoding]]
   */
  encoder(
    value: any,
    encoding: SerializedEncoding,
    intype: SerializedType,
    outtype: SerializedType,
    ...args: any[]
  ): any {
    if (typeof value === "undefined") {
      throw new UnknownTypeError(
        "Error - Serializable.encoder: value passed is undefined"
      )
    }
    if (encoding !== "display") {
      outtype = encoding
    }
    const vb: Buffer = this.typeToBuffer(value, intype, ...args)
    return this.bufferToType(vb, outtype, ...args)
  }

  /**
   * Convert value to type of [[SerializedType]] or [[SerializedEncoding]]
   *
   * @param value
   * @param encoding [[SerializedEncoding]]
   * @param intype [[SerializedType]]
   * @param outtype [[SerializedType]]
   * @param ...args remaining arguments
   * @returns type of [[SerializedType]] or [[SerializedEncoding]]
   */
  decoder(
    value: string,
    encoding: SerializedEncoding,
    intype: SerializedType,
    outtype: SerializedType,
    ...args: any[]
  ): any {
    if (typeof value === "undefined") {
      throw new UnknownTypeError(
        "Error - Serializable.decoder: value passed is undefined"
      )
    }
    if (encoding !== "display") {
      intype = encoding
    }
    const vb: Buffer = this.typeToBuffer(value, intype, ...args)
    return this.bufferToType(vb, outtype, ...args)
  }

  serialize(
    serialize: Serializable,
    vm: string,
    encoding: SerializedEncoding = "display",
    notes: string = undefined
  ): Serialized {
    if (typeof notes === "undefined") {
      notes = serialize.getTypeName()
    }
    return {
      vm,
      encoding,
      version: SERIALIZATIONVERSION,
      notes,
      fields: serialize.serialize(encoding)
    }
  }

  deserialize(input: Serialized, output: Serializable) {
    output.deserialize(input.fields, input.encoding)
  }
}
