/**
 * @packageDocumentation
 * @module Info-Interfaces
 */

import BN from "bn.js";

export interface iCredentials {
  username: string
  password: string
}

export interface iCreateUserParams extends iCredentials {}

export interface iExportUserParams extends iCredentials {}

export interface iImportUserParams extends iCredentials {
  user: string
}

export interface iDeleteUserParams extends iCredentials {}