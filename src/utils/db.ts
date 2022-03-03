/**
 * @packageDocumentation
 * @module Utils-DB
 */
import store, { StoreAPI } from "store2"

/**
 * A class for interacting with the {@link https://github.com/nbubna/store| store2 module}
 *
 * This class should never be instantiated directly. Instead, invoke the "DB.getInstance()" static
 * function to grab the singleton instance of the database.
 *
 * ```js
 * const db = DB.getInstance();
 * const blockchaindb = db.getNamespace("mychain");
 * ```
 */
export default class DB {
  private static instance: DB

  private static store = store

  private constructor() {}

  /**
   * Retrieves the database singleton.
   */
  static getInstance(): DB {
    if (!DB.instance) {
      DB.instance = new DB()
    }
    return DB.instance
  }

  /**
   * Gets a namespace from the database singleton.
   *
   * @param ns Namespace to retrieve.
   */
  static getNamespace(ns: string): StoreAPI {
    return this.store.namespace(ns)
  }
}
