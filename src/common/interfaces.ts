/**
 * @packageDocumentation
 * @module Common-Interfaces
 */

import { Buffer } from 'buffer/';

export interface Index {
  address: string
  utxo: string
}

export interface UTXOResponse {
  numFetched: number
  utxos: any
  endIndex: Index
}

export interface Asset {
  name: string
  symbol: string
  assetID: Buffer
  denomination: number
}

export interface BaseIndexParams {
  encoding: string
}

export interface BaseIndexResponse {
  id: string
  bytes: string
  timestamp: string
  encoding: string
  index: string
}

export interface GetLastAcceptedParams extends BaseIndexParams {}

export interface GetLastAcceptedResponse extends BaseIndexResponse {}

export interface GetContainerByIndexParams extends BaseIndexParams {
  index: string
}

export interface GetContainerByIndexResponse extends BaseIndexResponse {}

export interface GetContainerByIDParams extends BaseIndexParams {
  containerID: string
}

export interface GetContainerByIDResponse extends BaseIndexResponse {}

export interface GetContainerRangeParams extends BaseIndexParams {
  startIndex: number,
  numToFetch: number
}

export interface GetContainerRangeResponse extends BaseIndexResponse {}

export interface GetIndexParams extends BaseIndexParams {
  containerID: string
}

export interface GetIsAcceptedParams extends BaseIndexParams {
  containerID: string
}