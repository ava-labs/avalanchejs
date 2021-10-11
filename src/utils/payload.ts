/**
 * @packageDocumentation
 * @module Utils-Payload
 */

import { Buffer } from "buffer/"
import BinTools from "./bintools"
import BN from "bn.js"
import { TypeIdError, HexError } from "../utils/errors"
import { Serialization, SerializedType } from "../utils/serialization"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Class for determining payload types and managing the lookup table.
 */
export class PayloadTypes {
  private static instance: PayloadTypes
  protected types: string[] = []

  /**
   * Given an encoded payload buffer returns the payload content (minus typeID).
   */
  getContent(payload: Buffer): Buffer {
    const pl: Buffer = bintools.copyFrom(payload, 5)
    return pl
  }

  /**
   * Given an encoded payload buffer returns the payload (with typeID).
   */
  getPayload(payload: Buffer): Buffer {
    const pl: Buffer = bintools.copyFrom(payload, 4)
    return pl
  }

  /**
   * Given a payload buffer returns the proper TypeID.
   */
  getTypeID(payload: Buffer): number {
    const offset: number = 4
    const typeID: number = bintools
      .copyFrom(payload, offset, offset + 1)
      .readUInt8(0)
    return typeID
  }

  /**
   * Given a type string returns the proper TypeID.
   */
  lookupID(typestr: string): number {
    return this.types.indexOf(typestr)
  }

  /**
   * Given a TypeID returns a string describing the payload type.
   */
  lookupType(value: number): string {
    return this.types[`${value}`]
  }

  /**
   * Given a TypeID returns the proper [[PayloadBase]].
   */
  select(typeID: number, ...args: any[]): PayloadBase {
    switch (typeID) {
      case 0:
        return new BINPayload(...args)
      case 1:
        return new UTF8Payload(...args)
      case 2:
        return new HEXSTRPayload(...args)
      case 3:
        return new B58STRPayload(...args)
      case 4:
        return new B64STRPayload(...args)
      case 5:
        return new BIGNUMPayload(...args)
      case 6:
        return new XCHAINADDRPayload(...args)
      case 7:
        return new PCHAINADDRPayload(...args)
      case 8:
        return new CCHAINADDRPayload(...args)
      case 9:
        return new TXIDPayload(...args)
      case 10:
        return new ASSETIDPayload(...args)
      case 11:
        return new UTXOIDPayload(...args)
      case 12:
        return new NFTIDPayload(...args)
      case 13:
        return new SUBNETIDPayload(...args)
      case 14:
        return new CHAINIDPayload(...args)
      case 15:
        return new NODEIDPayload(...args)
      case 16:
        return new SECPSIGPayload(...args)
      case 17:
        return new SECPENCPayload(...args)
      case 18:
        return new JPEGPayload(...args)
      case 19:
        return new PNGPayload(...args)
      case 20:
        return new BMPPayload(...args)
      case 21:
        return new ICOPayload(...args)
      case 22:
        return new SVGPayload(...args)
      case 23:
        return new CSVPayload(...args)
      case 24:
        return new JSONPayload(...args)
      case 25:
        return new YAMLPayload(...args)
      case 26:
        return new EMAILPayload(...args)
      case 27:
        return new URLPayload(...args)
      case 28:
        return new IPFSPayload(...args)
      case 29:
        return new ONIONPayload(...args)
      case 30:
        return new MAGNETPayload(...args)
    }
    throw new TypeIdError(
      `Error - PayloadTypes.select: unknown typeid ${typeID}`
    )
  }

  /**
   * Given a [[PayloadBase]] which may not be cast properly, returns a properly cast [[PayloadBase]].
   */
  recast(unknowPayload: PayloadBase): PayloadBase {
    return this.select(unknowPayload.typeID(), unknowPayload.returnType())
  }

  /**
   * Returns the [[PayloadTypes]] singleton.
   */
  static getInstance(): PayloadTypes {
    if (!PayloadTypes.instance) {
      PayloadTypes.instance = new PayloadTypes()
    }

    return PayloadTypes.instance
  }

  private constructor() {
    this.types = [
      "BIN",
      "UTF8",
      "HEXSTR",
      "B58STR",
      "B64STR",
      "BIGNUM",
      "XCHAINADDR",
      "PCHAINADDR",
      "CCHAINADDR",
      "TXID",
      "ASSETID",
      "UTXOID",
      "NFTID",
      "SUBNETID",
      "CHAINID",
      "NODEID",
      "SECPSIG",
      "SECPENC",
      "JPEG",
      "PNG",
      "BMP",
      "ICO",
      "SVG",
      "CSV",
      "JSON",
      "YAML",
      "EMAIL",
      "URL",
      "IPFS",
      "ONION",
      "MAGNET"
    ]
  }
}

/**
 * Base class for payloads.
 */
export abstract class PayloadBase {
  protected payload: Buffer = Buffer.alloc(0)
  protected typeid: number = undefined

  /**
   * Returns the TypeID for the payload.
   */
  typeID(): number {
    return this.typeid
  }

  /**
   * Returns the string name for the payload's type.
   */
  typeName(): string {
    return PayloadTypes.getInstance().lookupType(this.typeid)
  }

  /**
   * Returns the payload content (minus typeID).
   */
  getContent(): Buffer {
    const pl: Buffer = bintools.copyFrom(this.payload)
    return pl
  }

  /**
   * Returns the payload (with typeID).
   */
  getPayload(): Buffer {
    const typeID: Buffer = Buffer.alloc(1)
    typeID.writeUInt8(this.typeid, 0)
    const pl: Buffer = Buffer.concat([typeID, bintools.copyFrom(this.payload)])
    return pl
  }

  /**
   * Decodes the payload as a {@link https://github.com/feross/buffer|Buffer} including 4 bytes for the length and TypeID.
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    const size: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.typeid = bintools.copyFrom(bytes, offset, offset + 1).readUInt8(0)
    offset += 1
    this.payload = bintools.copyFrom(bytes, offset, offset + size - 1)
    offset += size - 1
    return offset
  }

  /**
   * Encodes the payload as a {@link https://github.com/feross/buffer|Buffer} including 4 bytes for the length and TypeID.
   */
  toBuffer(): Buffer {
    const sizebuff: Buffer = Buffer.alloc(4)
    sizebuff.writeUInt32BE(this.payload.length + 1, 0)
    const typebuff: Buffer = Buffer.alloc(1)
    typebuff.writeUInt8(this.typeid, 0)
    return Buffer.concat([sizebuff, typebuff, this.payload])
  }

  /**
   * Returns the expected type for the payload.
   */
  abstract returnType(...args: any): any

  constructor() {}
}

/**
 * Class for payloads representing simple binary blobs.
 */
export class BINPayload extends PayloadBase {
  protected typeid = 0

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} for the payload.
   */
  returnType(): Buffer {
    return this.payload
  }
  /**
   * @param payload Buffer only
   */
  constructor(payload: any = undefined) {
    super()
    if (payload instanceof Buffer) {
      this.payload = payload
    } else if (typeof payload === "string") {
      this.payload = bintools.b58ToBuffer(payload)
    }
  }
}

/**
 * Class for payloads representing UTF8 encoding.
 */
export class UTF8Payload extends PayloadBase {
  protected typeid = 1

  /**
   * Returns a string for the payload.
   */
  returnType(): string {
    return this.payload.toString("utf8")
  }
  /**
   * @param payload Buffer utf8 string
   */
  constructor(payload: any = undefined) {
    super()
    if (payload instanceof Buffer) {
      this.payload = payload
    } else if (typeof payload === "string") {
      this.payload = Buffer.from(payload, "utf8")
    }
  }
}

/**
 * Class for payloads representing Hexadecimal encoding.
 */
export class HEXSTRPayload extends PayloadBase {
  protected typeid = 2

  /**
   * Returns a hex string for the payload.
   */
  returnType(): string {
    return this.payload.toString("hex")
  }
  /**
   * @param payload Buffer or hex string
   */
  constructor(payload: any = undefined) {
    super()
    if (payload instanceof Buffer) {
      this.payload = payload
    } else if (typeof payload === "string") {
      if (payload.startsWith("0x") || !payload.match(/^[0-9A-Fa-f]+$/)) {
        throw new HexError(
          "HEXSTRPayload.constructor -- hex string may not start with 0x and must be in /^[0-9A-Fa-f]+$/: " +
            payload
        )
      }
      this.payload = Buffer.from(payload, "hex")
    }
  }
}

/**
 * Class for payloads representing Base58 encoding.
 */
export class B58STRPayload extends PayloadBase {
  protected typeid = 3

  /**
   * Returns a base58 string for the payload.
   */
  returnType(): string {
    return bintools.bufferToB58(this.payload)
  }
  /**
   * @param payload Buffer or cb58 encoded string
   */
  constructor(payload: any = undefined) {
    super()
    if (payload instanceof Buffer) {
      this.payload = payload
    } else if (typeof payload === "string") {
      this.payload = bintools.b58ToBuffer(payload)
    }
  }
}

/**
 * Class for payloads representing Base64 encoding.
 */
export class B64STRPayload extends PayloadBase {
  protected typeid = 4

  /**
   * Returns a base64 string for the payload.
   */
  returnType(): string {
    return this.payload.toString("base64")
  }
  /**
   * @param payload Buffer of base64 string
   */
  constructor(payload: any = undefined) {
    super()
    if (payload instanceof Buffer) {
      this.payload = payload
    } else if (typeof payload === "string") {
      this.payload = Buffer.from(payload, "base64")
    }
  }
}

/**
 * Class for payloads representing Big Numbers.
 *
 * @param payload Accepts a Buffer, BN, or base64 string
 */
export class BIGNUMPayload extends PayloadBase {
  protected typeid = 5

  /**
   * Returns a {@link https://github.com/indutny/bn.js/|BN} for the payload.
   */
  returnType(): BN {
    return bintools.fromBufferToBN(this.payload)
  }
  /**
   * @param payload Buffer, BN, or base64 string
   */
  constructor(payload: any = undefined) {
    super()
    if (payload instanceof Buffer) {
      this.payload = payload
    } else if (payload instanceof BN) {
      this.payload = bintools.fromBNToBuffer(payload)
    } else if (typeof payload === "string") {
      this.payload = Buffer.from(payload, "hex")
    }
  }
}

/**
 * Class for payloads representing chain addresses.
 *
 */
export abstract class ChainAddressPayload extends PayloadBase {
  protected typeid = 6
  protected chainid: string = ""

  /**
   * Returns the chainid.
   */
  returnChainID(): string {
    return this.chainid
  }

  /**
   * Returns an address string for the payload.
   */
  returnType(hrp: string): string {
    const type: SerializedType = "bech32"
    return serialization.bufferToType(this.payload, type, hrp, this.chainid)
  }
  /**
   * @param payload Buffer or address string
   */
  constructor(payload: any = undefined, hrp?: string) {
    super()
    if (payload instanceof Buffer) {
      this.payload = payload
    } else if (typeof payload === "string") {
      if (hrp != undefined) {
        this.payload = bintools.stringToAddress(payload, hrp)
      } else {
        this.payload = bintools.stringToAddress(payload)
      }
    }
  }
}

/**
 * Class for payloads representing X-Chin addresses.
 */
export class XCHAINADDRPayload extends ChainAddressPayload {
  protected typeid = 6
  protected chainid = "X"
}

/**
 * Class for payloads representing P-Chain addresses.
 */
export class PCHAINADDRPayload extends ChainAddressPayload {
  protected typeid = 7
  protected chainid = "P"
}

/**
 * Class for payloads representing C-Chain addresses.
 */
export class CCHAINADDRPayload extends ChainAddressPayload {
  protected typeid = 8
  protected chainid = "C"
}

/**
 * Class for payloads representing data serialized by bintools.cb58Encode().
 */
export abstract class cb58EncodedPayload extends PayloadBase {
  /**
   * Returns a bintools.cb58Encoded string for the payload.
   */
  returnType(): string {
    return bintools.cb58Encode(this.payload)
  }
  /**
   * @param payload Buffer or cb58 encoded string
   */
  constructor(payload: any = undefined) {
    super()
    if (payload instanceof Buffer) {
      this.payload = payload
    } else if (typeof payload === "string") {
      this.payload = bintools.cb58Decode(payload)
    }
  }
}

/**
 * Class for payloads representing TxIDs.
 */
export class TXIDPayload extends cb58EncodedPayload {
  protected typeid = 9
}

/**
 * Class for payloads representing AssetIDs.
 */
export class ASSETIDPayload extends cb58EncodedPayload {
  protected typeid = 10
}

/**
 * Class for payloads representing NODEIDs.
 */
export class UTXOIDPayload extends cb58EncodedPayload {
  protected typeid = 11
}

/**
 * Class for payloads representing NFTIDs (UTXOIDs in an NFT context).
 */
export class NFTIDPayload extends UTXOIDPayload {
  protected typeid = 12
}

/**
 * Class for payloads representing SubnetIDs.
 */
export class SUBNETIDPayload extends cb58EncodedPayload {
  protected typeid = 13
}

/**
 * Class for payloads representing ChainIDs.
 */
export class CHAINIDPayload extends cb58EncodedPayload {
  protected typeid = 14
}

/**
 * Class for payloads representing NodeIDs.
 */
export class NODEIDPayload extends cb58EncodedPayload {
  protected typeid = 15
}

/**
 * Class for payloads representing secp256k1 signatures.
 * convention: secp256k1 signature (130 bytes)
 */
export class SECPSIGPayload extends B58STRPayload {
  protected typeid = 16
}

/**
 * Class for payloads representing secp256k1 encrypted messages.
 * convention: public key (65 bytes) + secp256k1 encrypted message for that public key
 */
export class SECPENCPayload extends B58STRPayload {
  protected typeid = 17
}

/**
 * Class for payloads representing JPEG images.
 */
export class JPEGPayload extends BINPayload {
  protected typeid = 18
}

export class PNGPayload extends BINPayload {
  protected typeid = 19
}

/**
 * Class for payloads representing BMP images.
 */
export class BMPPayload extends BINPayload {
  protected typeid = 20
}

/**
 * Class for payloads representing ICO images.
 */
export class ICOPayload extends BINPayload {
  protected typeid = 21
}

/**
 * Class for payloads representing SVG images.
 */
export class SVGPayload extends UTF8Payload {
  protected typeid = 22
}

/**
 * Class for payloads representing CSV files.
 */
export class CSVPayload extends UTF8Payload {
  protected typeid = 23
}

/**
 * Class for payloads representing JSON strings.
 */
export class JSONPayload extends PayloadBase {
  protected typeid = 24

  /**
   * Returns a JSON-decoded object for the payload.
   */
  returnType(): any {
    return JSON.parse(this.payload.toString("utf8"))
  }

  constructor(payload: any = undefined) {
    super()
    if (payload instanceof Buffer) {
      this.payload = payload
    } else if (typeof payload === "string") {
      this.payload = Buffer.from(payload, "utf8")
    } else if (payload) {
      let jsonstr: string = JSON.stringify(payload)
      this.payload = Buffer.from(jsonstr, "utf8")
    }
  }
}

/**
 * Class for payloads representing YAML definitions.
 */
export class YAMLPayload extends UTF8Payload {
  protected typeid = 25
}

/**
 * Class for payloads representing email addresses.
 */
export class EMAILPayload extends UTF8Payload {
  protected typeid = 26
}

/**
 * Class for payloads representing URL strings.
 */
export class URLPayload extends UTF8Payload {
  protected typeid = 27
}

/**
 * Class for payloads representing IPFS addresses.
 */
export class IPFSPayload extends B58STRPayload {
  protected typeid = 28
}

/**
 * Class for payloads representing onion URLs.
 */
export class ONIONPayload extends UTF8Payload {
  protected typeid = 29
}

/**
 * Class for payloads representing torrent magnet links.
 */
export class MAGNETPayload extends UTF8Payload {
  protected typeid = 30
}
