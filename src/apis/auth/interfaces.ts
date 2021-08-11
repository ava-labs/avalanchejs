/**
 * @packageDocumentation
 * @module Auth-Interfaces
 */

export interface NewTokenInterface {
  password: string
  endpoints: string[]
}

export interface RevokeTokenInterface {
  password: string
  token: string
}

export interface ChangePasswordInterface {
  oldPassword: string
  newPassword: string
}
