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

export interface GetLastAcceptedParams extends BaseIndexParams {}

export interface GetLastAcceptedResponse extends BaseIndexResponse {}

export interface GetLastVertexParams extends BaseIndexParams {}

export interface GetLastVertexResponse extends BaseIndexResponse {}

export interface GetContainerByIndexParams extends BaseIndexParams {
  index: string
}

export interface GetContainerByIndexResponse extends BaseIndexResponse {}

export interface GetContainerByIDParams extends BaseIndexParams {
  containerID: string
}

export interface GetContainerByIDResponse extends BaseIndexResponse {}

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
  containerID: string
}

export interface GetIsAcceptedParams extends BaseIndexParams {
  containerID: string
}
