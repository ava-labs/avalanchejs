/**
 * @packageDocumentation
 * @module Common-APIBase
 */

import { StoreAPI } from 'store2';
import { ClientRequest } from 'http';
import BinTools from '../utils/bintools';
import DB from '../utils/db';
import AvalancheCore from '../avalanche';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Response data for HTTP requests.
 */
export class RequestResponseData {
  data: any;

  headers:any;

  status: number;

  statusText: string;

  request:ClientRequest | XMLHttpRequest;
}

/**
 * Abstract class defining a generic endpoint that all endpoints must implement (extend).
 */
export abstract class APIBase {
  protected core:AvalancheCore;

  protected baseurl:string;

  protected db:StoreAPI;

  /**
     * Sets the path of the APIs baseurl.
     *
     * @param baseurl Path of the APIs baseurl - ex: "/ext/bc/X"
     */
  setBaseURL = (baseurl:string) => {
    if (this.db && this.baseurl !== baseurl) {
      const backup = this.db.getAll();
      this.db.clearAll();
      this.baseurl = baseurl;
      this.db = DB.getNamespace(baseurl);
      this.db.setAll(backup, true);
    } else {
      this.baseurl = baseurl;
      this.db = DB.getNamespace(baseurl);
    }
  };

  /**
     * Returns the baseurl's path.
     */
  getBaseURL = () : string => this.baseurl;

  /**
     * Returns the baseurl's database.
     */
  getDB = ():StoreAPI => this.db;

  /**
     *
     * @param core Reference to the Avalanche instance using this baseurl
     * @param baseurl Path to the baseurl - ex: "/ext/bc/X"
     */
  constructor(core:AvalancheCore, baseurl:string) {
    this.core = core;
    this.setBaseURL(baseurl);
  }
}

