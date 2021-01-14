/**
 * @packageDocumentation
 * @module Health-Interfaces
 */

export interface iGetLivenessResponse {
  checks: {
      C: {
          message: object,
          timestamp: string ,
          duration: number,
          contiguousFailures: number,
          timeOfFirstFailure: null
      },
      P: {
          message: {
              percentConnected: number
          },
          timestamp: string,
          duration: number ,
          contiguousFailures: number,
          timeOfFirstFailure: null
      },
      X: {
          timestamp: string,
          duration: number,
          contiguousFailures: number,
          timeOfFirstFailure: null
      },
      "chains.default.bootstrapped": {
          timestamp: string,
          duration: number,
          contiguousFailures: number,
          timeOfFirstFailure: null
      },
      "network.validators.heartbeat": {
          message: {
              heartbeat: number 
          },
          timestamp: string,
          duration: number,
          contiguousFailures: number,
          timeOfFirstFailure: null
      }
  },
  healthy: boolean
}