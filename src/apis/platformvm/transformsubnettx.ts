/**
 * @packageDocumentation
 * @module API-PlatformVM-TransformSubnetTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import { TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { Credential, SigIdx, Signature } from "../../common/credentials"
import { BaseTx } from "./basetx"
import { DefaultNetworkID } from "../../utils/constants"
import { SelectCredentialClass, SubnetAuth } from "."
import { KeyChain, KeyPair } from "./keychain"
import BN from "bn.js"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

/**
 * Class representing an unsigned TransformSubnetTx transaction.
 */
export class TransformSubnetTx extends BaseTx {
  protected _typeName = "TransformSubnetTx"
  protected _typeID = PlatformVMConstants.TRANSFORMSUBNETTX
  protected subnetID: Buffer = Buffer.alloc(32)
  protected assetID: Buffer = Buffer.alloc(32)
  protected initialSupply: Buffer = Buffer.alloc(8)
  protected maximumSupply: Buffer = Buffer.alloc(8)
  protected minConsumptionRate: Buffer = Buffer.alloc(8)
  protected maxConsumptionRate: Buffer = Buffer.alloc(8)
  protected minValidatorStake: Buffer = Buffer.alloc(8)
  protected maxValidatorStake: Buffer = Buffer.alloc(8)
  protected minStakeDuration: Buffer = Buffer.alloc(4)
  protected maxStakeDuration: Buffer = Buffer.alloc(4)
  protected minDelegationFee: Buffer = Buffer.alloc(4)
  protected minDelegatorStake: Buffer = Buffer.alloc(4)
  protected maxValidatorWeightFactor: Buffer = Buffer.alloc(1)
  protected uptimeRequirement: Buffer = Buffer.alloc(4)
  protected subnetAuth: SubnetAuth
  protected sigCount: Buffer = Buffer.alloc(4)
  protected sigIdxs: SigIdx[] = [] // idxs of subnet auth signers

  /**
   * Returns the id of the [[TransformSubnetTx]]
   */
  getTxType(): number {
    return PlatformVMConstants.TRANSFORMSUBNETTX
  }

  /**
   * Returns the subnetID as a string
   */
  getSubnetID(): string {
    return bintools.cb58Encode(this.subnetID)
  } 

  /**
  * Returns the assetID of the input
  */
  getAssetID(): Buffer {
    return this.assetID
  } 

  /**
   * Returns a {@link https://github.com/indutny/bn.js/|BN} for the initialSupply
   */
  getInitialSupply(): BN {
    return bintools.fromBufferToBN(this.initialSupply)
  }

  /**
   * Returns a {@link https://github.com/indutny/bn.js/|BN} for the maximumSupply
   */
  getMaximumSupply(): BN {
    return bintools.fromBufferToBN(this.maximumSupply)
  }

  /**
   * Returns a {@link https://github.com/indutny/bn.js/|BN} for the minConsumptionRate
   */
  getMinConsumptionRate(): BN {
    return bintools.fromBufferToBN(this.minConsumptionRate)
  }

  /**
   * Returns a {@link https://github.com/indutny/bn.js/|BN} for the maxConsumptionRate
   */
  getMaxConsumptionRate(): BN {
    return bintools.fromBufferToBN(this.maxConsumptionRate)
  }

  /**
   * Returns a {@link https://github.com/indutny/bn.js/|BN} for the minValidatorStake
   */
  getMinValidatorStake(): BN {
    return bintools.fromBufferToBN(this.minValidatorStake)
  }

  /**
   * Returns a {@link https://github.com/indutny/bn.js/|BN} for the maxValidatorStake
   */
  getMaxValidatorStake(): BN {
    return bintools.fromBufferToBN(this.maxValidatorStake)
  }

  /**
   * Returns a {@link https://github.com/indutny/bn.js/|BN} for the minStakeDuration
   */
  getMinStakeDuration(): BN {
    return bintools.fromBufferToBN(this.minStakeDuration)
  }

  /**
   * Returns a {@link https://github.com/indutny/bn.js/|BN} for the maxStakeDuration
   */
  getMaxStakeDuration(): BN {
    return bintools.fromBufferToBN(this.maxStakeDuration)
  }

  /**
   * Returns a {@link https://github.com/indutny/bn.js/|BN} for the minDelegationFee
   */
  getMinDelegationFee(): BN {
    return bintools.fromBufferToBN(this.minDelegationFee)
  }

  /**
   * Returns a {@link https://github.com/indutny/bn.js/|BN} for the minDelegatorStake
   */
  getMinDelegatorStake(): BN {
    return bintools.fromBufferToBN(this.minDelegatorStake)
  }

  /**
  * Returns the numeric representation of the maxValidatorWeightFactor
  */
  getMaxValidatorWeightFactor(): number {
    return this.maxValidatorWeightFactor.readUInt8(0)
  }

  /**
   * Returns a {@link https://github.com/indutny/bn.js/|BN} for the uptimeRequirement
   */
  getUptimeRequirement(): BN {
    return bintools.fromBufferToBN(this.uptimeRequirement)
  }

  /**
   * Returns the subnetAuth
   */
  getSubnetAuth(): SubnetAuth {
    return this.subnetAuth
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[TransformSubnetTx]], parses it, populates the class, and returns the length of the [[TransformSubnetTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[TransformSubnetTx]]
   *
   * @returns The length of the raw [[TransformSubnetTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)

    this.subnetID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32

    this.assetID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32

    this.initialSupply = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8

    this.maximumSupply = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8

    this.minConsumptionRate = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8

    this.maxConsumptionRate = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8

    this.minValidatorStake = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8

    this.maxValidatorStake = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8

    this.minStakeDuration = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4

    this.maxStakeDuration = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4

    this.minDelegationFee = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4

    this.minDelegatorStake = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4

    this.maxValidatorWeightFactor = bintools.copyFrom(bytes, offset, offset + 1)
    offset += 1

    this.uptimeRequirement = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4

    const sa: SubnetAuth = new SubnetAuth()
    offset += sa.fromBuffer(bintools.copyFrom(bytes, offset))
    this.subnetAuth = sa

    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[TransformSubnetTx]].
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()

    const bsize: number =
      superbuff.length +
      this.subnetID.length +
      this.assetID.length +
      this.initialSupply.length +
      this.maximumSupply.length +
      this.minConsumptionRate.length +
      this.maxConsumptionRate.length +
      this.minValidatorStake.length +
      this.maxValidatorStake.length +
      this.minStakeDuration.length +
      this.maxStakeDuration.length +
      this.minDelegationFee.length +
      this.minDelegatorStake.length +
      this.maxValidatorWeightFactor.length +
      this.uptimeRequirement.length +
      this.subnetAuth.toBuffer().length

    const barr: Buffer[] = [
      superbuff,
      this.subnetID,
      this.assetID,
      this.initialSupply,
      this.maximumSupply,
      this.minConsumptionRate,
      this.maxConsumptionRate,
      this.minValidatorStake,
      this.maxValidatorStake,
      this.minStakeDuration,
      this.maxStakeDuration,
      this.minDelegationFee,
      this.minDelegatorStake,
      this.maxValidatorWeightFactor,
      this.uptimeRequirement,
      this.subnetAuth.toBuffer()
    ]
    return Buffer.concat(barr, bsize)
  }

  clone(): this {
    const newTransformSubnetTx: TransformSubnetTx =
      new TransformSubnetTx()
    newTransformSubnetTx.fromBuffer(this.toBuffer())
    return newTransformSubnetTx as this
  }

  create(...args: any[]): this {
    return new TransformSubnetTx(...args) as this
  }

  /**
   * Creates and adds a [[SigIdx]] to the [[TransformSubnetTx]].
   *
   * @param addressIdx The index of the address to reference in the signatures
   * @param address The address of the source of the signature
   */
  addSignatureIdx(addressIdx: number, address: Buffer): void {
    const addressIndex: Buffer = Buffer.alloc(4)
    addressIndex.writeUIntBE(addressIdx, 0, 4)
    this.subnetAuth.addAddressIndex(addressIndex)

    const sigidx: SigIdx = new SigIdx()
    const b: Buffer = Buffer.alloc(4)
    b.writeUInt32BE(addressIdx, 0)
    sigidx.fromBuffer(b)
    sigidx.setSource(address)
    this.sigIdxs.push(sigidx)
    this.sigCount.writeUInt32BE(this.sigIdxs.length, 0)
  }

  /**
   * Returns the array of [[SigIdx]] for this [[Input]]
   */
  getSigIdxs(): SigIdx[] {
    return this.sigIdxs
  }

  getCredentialID(): number {
    return PlatformVMConstants.SECPCREDENTIAL
  }

  /**
   * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
   *
   * @param msg A Buffer for the [[UnsignedTx]]
   * @param kc An [[KeyChain]] used in signing
   *
   * @returns An array of [[Credential]]s
   */
  sign(msg: Buffer, kc: KeyChain): Credential[] {
    const creds: Credential[] = super.sign(msg, kc)
    const sigidxs: SigIdx[] = this.getSigIdxs()
    const cred: Credential = SelectCredentialClass(this.getCredentialID())
    for (let i: number = 0; i < sigidxs.length; i++) {
      const keypair: KeyPair = kc.getKey(sigidxs[`${i}`].getSource())
      const signval: Buffer = keypair.sign(msg)
      const sig: Signature = new Signature()
      sig.fromBuffer(signval)
      cred.addSignature(sig)
    }
    creds.push(cred)
    return creds
  }

  /**
   * Class representing an unsigned AddSubnetValidator transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param subnetID Optional. Subnet ID of the Subnet to transform
   * @param assetID Optional. Defines which asset to use when staking on the Subnet
   * @param initialSupply Optional. Amount to initially specify as the current supply
   * @param maximumSupply Optional. Amount to specify as the maximum token supply
   * @param minConsumptionRate Optional. Rate to allocate funds if the
  validator's stake duration is 0
   * @param maxConsumptionRate Optional. Rate to allocate funds if the
  validator's stake duration is equal to the minting period
   * @param minValidatorStake Optional. Minimum amount of funds required to become a validator
   * @param maxValidatorStake Optional. Maximum amount of funds a
  single validator can be allocated, including delegated funds
   * @param minStakeDuration Optional. Minimum number of seconds a staker can stake for
   * @param maxStakeDuration Optional. Maximum number of seconds a staker can stake for
   * @param maxStakeDuration Optional. Minimum percentage a validator must
   * @param minDelegationFee Optional. Minimum percentage a validator must
  charge a delegator for delegating
   * @param minDelegatorStake Optional. Minimum amount of funds required to become a delegator
   * @param maxValidatorWeightFactor Optional. Factor which calculates
  the maximum amount of delegation a validator can receive. Note: a value of 1
  effectively disables delegation
   * @param uptimeRequirement Optional. Minimum percentage a validator
  must be online and responsive to receive a reward
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    subnetID: string | Buffer = undefined,
    assetID: string | Buffer = undefined,
    initialSupply: BN = undefined,
    maximumSupply: BN = undefined,
    minConsumptionRate: BN = undefined,
    maxConsumptionRate: BN = undefined,
    minValidatorStake: BN = undefined,
    maxValidatorStake: BN = undefined,
    minStakeDuration: number = undefined,
    maxStakeDuration: number = undefined,
    minDelegationFee: number = undefined,
    minDelegatorStake: BN = undefined,
    maxValidatorWeightFactor: number = undefined,
    uptimeRequirement: number = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    if (typeof subnetID != "undefined") {
      if (typeof subnetID === "string") {
        this.subnetID = bintools.cb58Decode(subnetID)
      } else {
        this.subnetID = subnetID
      }
    }

    if (typeof assetID === "string") {
      this.assetID = bintools.cb58Decode(assetID)
    } else {
      this.assetID = assetID
    }
 
    if (typeof initialSupply != "undefined") {
      this.initialSupply = bintools.fromBNToBuffer(initialSupply, 8)
    }
 
    if (typeof maximumSupply != "undefined") {
      this.maximumSupply = bintools.fromBNToBuffer(maximumSupply, 8)
    }
 
    if (typeof minConsumptionRate != "undefined") {
      this.minConsumptionRate = bintools.fromBNToBuffer(minConsumptionRate, 8)
    }
 
    if (typeof maxConsumptionRate != "undefined") {
      this.maxConsumptionRate = bintools.fromBNToBuffer(maxConsumptionRate, 8)
    }
 
    if (typeof minValidatorStake != "undefined") {
      this.minValidatorStake = bintools.fromBNToBuffer(minValidatorStake, 8)
    }
 
    if (typeof maxValidatorStake != "undefined") {
      this.maxValidatorStake = bintools.fromBNToBuffer(maxValidatorStake, 8)
    }
  
    if (typeof minStakeDuration != "undefined") {
      this.minStakeDuration.writeUInt32BE(minStakeDuration, 0)
    } 
  
    if (typeof maxStakeDuration != "undefined") {
      this.maxStakeDuration.writeUInt32BE(maxStakeDuration, 0)
    } 
  
    if (typeof minDelegationFee != "undefined") {
      this.minDelegationFee.writeUInt32BE(minDelegationFee, 0)
    } 
  
    if (typeof minDelegatorStake != "undefined") {
      this.minDelegatorStake = bintools.fromBNToBuffer(minDelegatorStake, 8)
    } 
  
    if (typeof maxValidatorWeightFactor != "undefined") {
      this.maxValidatorWeightFactor.writeUInt8(maxValidatorWeightFactor, 0)
    } 
    
    if (typeof uptimeRequirement != "undefined") {
      this.uptimeRequirement.writeUInt32BE(uptimeRequirement, 0)
    } 

    const subnetAuth: SubnetAuth = new SubnetAuth()
    this.subnetAuth = subnetAuth
  }
}
