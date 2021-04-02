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

export interface BaseIndexResponse {
  id: string
  bytes: string
  timestamp: string
  encoding: string
  index: string
}

export interface GetLastAcceptedParams {
  encoding: string
}

export interface GetLastAcceptedResponse extends BaseIndexResponse {}

export interface GetContainerByIndexParams {
  index: string,
  encoding: string
}

export interface GetContainerByIndexResponse extends BaseIndexResponse {}

export interface GetContainerByIDParams {
  containerID: string,
  encoding: string
}

export interface GetContainerByIDResponse extends BaseIndexResponse {}

export interface GetContainerRangeParams {
  startIndex: number,
  numToFetch: number,
  encoding: string
}

export interface GetContainerRangeResponse extends BaseIndexResponse {}

export interface GetIndexParams {
  containerID: string,
  encoding: string
}

export interface GetIsAcceptedParams {
  containerID: string,
  encoding: string
}