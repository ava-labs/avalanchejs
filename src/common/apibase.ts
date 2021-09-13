/**
 * @packageDocumentation
 * @module Common-APIBase
 */

import { StoreAPI } from "store2"
import { ClientRequest } from "http"
import DB from "../utils/db"
import AvalancheCore from "../avalanche"

/**
 * Response data for HTTP requests.
 */
export class RequestResponseData {
  constructor(
    public data: any,
    public headers: any,
    public status: number,
    public statusText: string,
    public request: ClientRequest | XMLHttpRequest
  ) {}
}

/**
 * Abstract class defining a generic endpoint that all endpoints must implement (extend).
 */
export abstract class APIBase {
  protected core: AvalancheCore
  protected baseURL: string
  protected db: StoreAPI

  /**
   * Sets the path of the APIs baseURL.
   *
   * @param baseURL Path of the APIs baseURL - ex: "/ext/bc/X"
   */
  setBaseURL = (baseURL: string) => {
    if (this.db && this.baseURL !== baseURL) {
      const backup = this.db.getAll()
      this.db.clearAll()
      this.baseURL = baseURL
      this.db = DB.getNamespace(baseURL)
      this.db.setAll(backup, true)
    } else {
      this.baseURL = baseURL
      this.db = DB.getNamespace(baseURL)
    }
  }

  /**
   * Returns the baseURL's path.
   */
  getBaseURL = (): string => this.baseURL

  /**
   * Returns the baseURL's database.
   */
  getDB = (): StoreAPI => this.db

  /**
   *
   * @param core Reference to the Avalanche instance using this baseURL
   * @param baseURL Path to the baseURL
   */
  constructor(core: AvalancheCore, baseURL: string) {
    this.core = core
    this.setBaseURL(baseURL)
  }
}
