/**
 * @packageDocumentation
 * @module Admin-Interfaces
 */

export interface AliasParams {
  endpoint: string
  alias: string
}

export interface AliasChainParams {
  chain: string
  alias: string
}

export interface GetChainAliasesParams {
  chain: string
}
