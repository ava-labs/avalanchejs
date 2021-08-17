/**
 * @packageDocumentation
 * @module API-Keystore
 */
import AvalancheCore from "../../avalanche"
import { JRPCAPI } from "../../common/jrpcapi"
import { RequestResponseData } from "../../common/apibase"
import { ImportUserParams } from "./interfaces"
import { CredsInterface } from "../../common/interfaces"

/**
 * Class for interacting with a node API that is using the node's KeystoreAPI.
 *
 * **WARNING**: The KeystoreAPI is to be used by the node-owner as the data is stored locally on the node. Do not trust the root user. If you are not the node-owner, do not use this as your wallet.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
export class KeystoreAPI extends JRPCAPI {
  /**
   * Creates a user in the node's database.
   *
   * @param username Name of the user to create
   * @param password Password for the user
   *
   * @returns Promise for a boolean with true on success
   */
  createUser = async (username: string, password: string): Promise<boolean> => {
    const params: CredsInterface = {
      username,
      password
    }
    const response: RequestResponseData = await this.callMethod(
      "keystore.createUser",
      params
    )
    return response.data.result.success
      ? response.data.result.success
      : response.data.result
  }

  /**
   * Exports a user. The user can be imported to another node with keystore.importUser .
   *
   * @param username The name of the user to export
   * @param password The password of the user to export
   *
   * @returns Promise with a string importable using importUser
   */
  exportUser = async (username: string, password: string): Promise<string> => {
    const params: CredsInterface = {
      username,
      password
    }
    const response: RequestResponseData = await this.callMethod(
      "keystore.exportUser",
      params
    )
    return response.data.result.user
      ? response.data.result.user
      : response.data.result
  }

  /**
   * Imports a user file into the node's user database and assigns it to a username.
   *
   * @param username The name the user file should be imported into
   * @param user cb58 serialized string represetning a user"s data
   * @param password The user"s password
   *
   * @returns A promise with a true-value on success.
   */
  importUser = async (
    username: string,
    user: string,
    password: string
  ): Promise<boolean> => {
    const params: ImportUserParams = {
      username,
      user,
      password
    }
    const response: RequestResponseData = await this.callMethod(
      "keystore.importUser",
      params
    )
    return response.data.result.success
      ? response.data.result.success
      : response.data.result
  }

  /**
   * Lists the names of all users on the node.
   *
   * @returns Promise of an array with all user names.
   */
  listUsers = async (): Promise<string[]> => {
    const response: RequestResponseData = await this.callMethod(
      "keystore.listUsers"
    )
    return response.data.result.users
  }

  /**
   * Deletes a user in the node's database.
   *
   * @param username Name of the user to delete
   * @param password Password for the user
   *
   * @returns Promise for a boolean with true on success
   */
  deleteUser = async (username: string, password: string): Promise<boolean> => {
    const params: CredsInterface = {
      username,
      password
    }
    const response: RequestResponseData = await this.callMethod(
      "keystore.deleteUser",
      params
    )
    return response.data.result.success
      ? response.data.result.success
      : response.data.result
  }

  /**
   * This class should not be instantiated directly. Instead use the [[Avalanche.addAPI]] method.
   *
   * @param core A reference to the Avalanche class
   * @param baseURL Defaults to the string "/ext/keystore" as the path to rpc's baseURL
   */
  constructor(core: AvalancheCore, baseURL: string = "/ext/keystore") {
    super(core, baseURL)
  }
}
