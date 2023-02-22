/**
 * @packageDocumentation
 * @module Index-Interfaces
 */

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

export type GetLastAcceptedParams = BaseIndexParams

export type GetLastAcceptedResponse = BaseIndexResponse

export type GetLastVertexParams = BaseIndexParams

export type GetLastVertexResponse = BaseIndexResponse

export interface GetContainerByIndexParams extends BaseIndexParams {
  index: string
}

export type GetContainerByIndexResponse = BaseIndexResponse

export interface GetContainerByIDParams extends BaseIndexParams {
  id: string
}

export type GetContainerByIDResponse = BaseIndexResponse

export interface GetContainerRangeParams extends BaseIndexParams {
  startIndex: number
  numToFetch: number
}

export interface IsAcceptedResponse {
  isAccepted: boolean
}

export interface GetContainerRangeResponse {
  constainer: BaseIndexParams[]
}

export interface GetIndexParams extends BaseIndexParams {
  id: string
}

export interface GetIsAcceptedParams extends BaseIndexParams {
  id: string
}
