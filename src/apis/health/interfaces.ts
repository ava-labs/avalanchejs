/**
 * @packageDocumentation
 * @module Health-Interfaces
 */

export interface Entity {
  message?: Object[]
  timestamp: string
  duration: number
  contiguousFailures?: number
  timeOfFirstFailure?: string
}

export interface Checks {
  C: Entity
  P: Entity
  X: Entity
  bootstrapped: Entity
  network: Entity
  router: Entity
}

export interface HealthResponse {
  checks: Checks
  healthy: boolean
}
