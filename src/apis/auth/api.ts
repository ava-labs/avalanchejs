/**
 * @packageDocumentation
 * @module API-Auth
 */
import AvalancheCore from "../../avalanche"
import { JRPCAPI } from "../../common/jrpcapi"
import { RequestResponseData } from "../../common/apibase"
import { ErrorResponseObject } from "../../utils/errors"
import {
  ChangePasswordInterface,
  NewTokenInterface,
  RevokeTokenInterface
} from "./interfaces"

/**
 * Class for interacting with a node's AuthAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
export class AuthAPI extends JRPCAPI {
  /**
   * Creates a new authorization token that grants access to one or more API endpoints.
   *
   * @param password This node's authorization token password, set through the CLI when the node was launched.
   * @param endpoints A list of endpoints that will be accessible using the generated token. If there"s an element that is "*", this token can reach any endpoint.
   *
   * @returns Returns a Promise string containing the authorization token.
   */
  newToken = async (
    password: string,
    endpoints: string[]
  ): Promise<string | ErrorResponseObject> => {
    const params: NewTokenInterface = {
      password,
      endpoints
    }
    const response: RequestResponseData = await this.callMethod(
      "auth.newToken",
      params
    )
    return response.data.result.token
      ? response.data.result.token
      : response.data.result
  }

  /**
   * Revokes an authorization token, removing all of its rights to access endpoints.
   *
   * @param password This node's authorization token password, set through the CLI when the node was launched.
   * @param token An authorization token whose access should be revoked.
   *
   * @returns Returns a Promise boolean indicating if a token was successfully revoked.
   */
  revokeToken = async (password: string, token: string): Promise<boolean> => {
    const params: RevokeTokenInterface = {
      password,
      token
    }
    const response: RequestResponseData = await this.callMethod(
      "auth.revokeToken",
      params
    )
    return response.data.result.success
  }

  /**
   * Change this node's authorization token password. **Any authorization tokens created under an old password will become invalid.**
   *
   * @param oldPassword This node's authorization token password, set through the CLI when the node was launched.
   * @param newPassword A new password for this node's authorization token issuance.
   *
   * @returns Returns a Promise boolean indicating if the password was successfully changed.
   */
  changePassword = async (
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    const params: ChangePasswordInterface = {
      oldPassword,
      newPassword
    }
    const response: RequestResponseData = await this.callMethod(
      "auth.changePassword",
      params
    )
    return response.data.result.success
  }

  /**
   * This class should not be instantiated directly. Instead use the [[Avalanche.addAPI]]
   * method.
   *
   * @param core A reference to the Avalanche class
   * @param baseURL Defaults to the string "/ext/auth" as the path to rpc's baseURL
   */
  constructor(core: AvalancheCore, baseURL: string = "/ext/auth") {
    super(core, baseURL)
  }
}
