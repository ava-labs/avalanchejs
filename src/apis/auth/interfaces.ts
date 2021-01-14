/**
 * @packageDocumentation
 * @module Auth-Interfaces
 */

export interface iNewTokenParams {
  password: string 
  endpoints: string[]
}

export interface iRevokeTokenParams {
  password: string 
  token: string
}

export interface iChangePasswordParams {
  oldPassword: string 
  newPassword: string
}