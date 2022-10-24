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

export interface GetLoggerLevelParams {
  loggerName?: string
}

export interface Level {
  logLevel: string
  displayLevel: string
}

export interface LoggerLevels {
  C: Level
  "C.http": Level
  P: Level
  "P.http": Level
  X: Level
  "X.http": Level
  http: Level
  main: Level
}

export interface GetLoggerLevelResponse {
  loggerLevels: LoggerLevels
}

export interface LoadVMsResponse {
  newVMs: object
  failedVMs?: object
}

export interface SetLoggerLevelParams {
  loggerName?: string
  logLevel?: string
  displayLevel?: string
}

export interface SetLoggerLevelResponse {
  success: boolean
}
