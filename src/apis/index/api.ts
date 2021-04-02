/**
 * @packageDocumentation
 * @module Index-Auth
 */
import AvalancheCore from '../../avalanche';
import { JRPCAPI } from '../../common/jrpcapi';
import { RequestResponseData } from '../../common/apibase';
import { 
    GetLastAcceptedParams, 
    GetLastAcceptedResponse,
    GetContainerByIndexParams,
    GetContainerByIndexResponse,
    GetContainerByIDParams,
    GetContainerByIDResponse,
    GetContainerRangeParams,
    GetContainerRangeResponse,
    GetIndexParams,
    GetIsAcceptedParams,
} from 'src/common/interfaces';

/**
 * Class for interacting with a node's IndexAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
export class IndexAPI extends JRPCAPI {
    /**
     * TODO - add description
     *
     * @param encoding 
     *
     * @returns Returns a Promise<GetLastAcceptedResponse>.
     */
    getLastAccepted = async (encoding: string = "cb58"): Promise<GetLastAcceptedResponse> => {
      const params: GetLastAcceptedParams = {
        encoding
      };

      try {
        const response: RequestResponseData = await this.callMethod("index.getLastAccepted", params);
        return response['data']['result'];
      } catch (error) {
        console.log(error)
      }
    };

    /**
     * TODO - add description
     *
     * @param index
     * @param encoding 
     *
     * @returns Returns a Promise<GetContainerByIndexResponse>.
     */
     getContainerByIndex = async (index: string = "0", encoding: string = "cb58"): Promise<GetContainerByIndexResponse> => {
      const params: GetContainerByIndexParams = {
        index,
        encoding
      };

      try {
        const response: RequestResponseData = await this.callMethod("index.getContainerByIndex", params);
        return response['data']['result'];
      } catch (error) {
        console.log(error)
      }
    };

    /**
     * TODO - add description
     *
     * @param containerID
     * @param encoding 
     *
     * @returns Returns a Promise<GetContainerByIDResponse>.
     */
     getContainerByID = async (containerID: string = "0", encoding: string = "cb58"): Promise<GetContainerByIDResponse> => {
      const params: GetContainerByIDParams = {
        containerID,
        encoding
      };

      try {
        const response: RequestResponseData = await this.callMethod("index.getContainerByID", params);
        return response['data']['result'];
      } catch (error) {
        console.log(error)
      }
    };

    /**
     * TODO - add description
     *
     * @param startIndex
     * @param numToFetch
     * @param encoding 
     *
     * @returns Returns a Promise<GetContainerRangeResponse>.
     */
     getContainerRange = async (startIndex: number = 0, numToFetch: number = 100, encoding: string = "hex"): Promise<GetContainerRangeResponse[]> => {
      const params: GetContainerRangeParams = {
        startIndex,
        numToFetch,
        encoding
      };

      try {
        const response: RequestResponseData = await this.callMethod("index.getContainerRange", params);
        return response['data']['result'];
      } catch (error) {
        console.log(error)
      }
    };

    /**
     * TODO - add description
     *
     * @param containerID
     * @param encoding 
     *
     * @returns Returns a Promise<GetIndexResponse>.
     */
     getIndex = async (containerID: string = "", encoding: string = "hex"): Promise<string> => {
      const params: GetIndexParams = {
        containerID,
        encoding
      };

      try {
        const response: RequestResponseData = await this.callMethod("index.getIndex", params);
        return response['data']['result']['index'];
      } catch (error) {
        console.log(error)
      }
    };

    /**
     * TODO - add description
     *
     * @param containerID
     * @param encoding 
     *
     * @returns Returns a Promise<GetIsAcceptedResponse>.
     */
     isAccepted = async (containerID: string = "", encoding: string = "hex"): Promise<boolean> => {
      const params: GetIsAcceptedParams = {
        containerID,
        encoding
      };

      try {
        const response: RequestResponseData = await this.callMethod("index.isAccepted", params);
        return response['data']['result'];
      } catch (error) {
        console.log(error)
      }
    };

    constructor(core: AvalancheCore, baseurl: string = "/ext/index/X/tx") { super(core, baseurl); }
}
