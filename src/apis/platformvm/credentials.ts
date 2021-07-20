/**
 * @packageDocumentation
 * @module API-PlatformVM-Credentials
 */

import { PlatformVMConstants } from "./constants"
import { Credential } from "../../common/credentials"
import { CredIdError } from "../../utils/errors"

/**
 * Takes a buffer representing the credential and returns the proper [[Credential]] instance.
 *
 * @param credid A number representing the credential ID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Credential]]-extended class.
 */
export const SelectCredentialClass = (
  credid: number,
  ...args: any[]
): Credential => {
  if (credid === PlatformVMConstants.SECPCREDENTIAL) {
    return new SECPCredential(...args)
  }
  /* istanbul ignore next */
  throw new CredIdError("Error - SelectCredentialClass: unknown credid")
}

export class SECPCredential extends Credential {
  protected _typeName = "SECPCredential"
  protected _typeID = PlatformVMConstants.SECPCREDENTIAL

  //serialize and deserialize both are inherited

  getCredentialID(): number {
    return this._typeID
  }

  clone(): this {
    let newbase: SECPCredential = new SECPCredential()
    newbase.fromBuffer(this.toBuffer())
    return newbase as this
  }

  create(...args: any[]): this {
    return new SECPCredential(...args) as this
  }

  select(id: number, ...args: any[]): Credential {
    let newbasetx: Credential = SelectCredentialClass(id, ...args)
    return newbasetx
  }
}
