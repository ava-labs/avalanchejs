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
} from '../../common/interfaces';

/**
 * Class for interacting with a node's IndexAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
export class IndexAPI extends JRPCAPI {
    /**
     * Get last accepted tx, vtx or block
     *
     * @param encoding 
     * @param baseurl
     *
     * @returns Returns a Promise<GetLastAcceptedResponse>.
     */
     getLastAccepted = async (encoding: string = "cb58", baseurl: string = this.getBaseURL()): Promise<GetLastAcceptedResponse> => {
      this.setBaseURL(baseurl)
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
     * Get container by index
     *
     * @param index
     * @param encoding 
     * @param baseurl
     *
     * @returns Returns a Promise<GetContainerByIndexResponse>.
     */
     getContainerByIndex = async (index: string = "0", encoding: string = "cb58", baseurl: string = this.getBaseURL()): Promise<GetContainerByIndexResponse> => {
      this.setBaseURL(baseurl)
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
     * Get contrainer by ID
     *
     * @param containerID
     * @param encoding 
     * @param baseurl
     *
     * @returns Returns a Promise<GetContainerByIDResponse>.
     */
     getContainerByID = async (containerID: string = "0", encoding: string = "cb58", baseurl: string = this.getBaseURL()): Promise<GetContainerByIDResponse> => {
      this.setBaseURL(baseurl)
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
     * Get container range
     *
     * @param startIndex
     * @param numToFetch
     * @param encoding 
     * @param baseurl
     *
     * @returns Returns a Promise<GetContainerRangeResponse>.
     */
     getContainerRange = async (startIndex: number = 0, numToFetch: number = 100, encoding: string = "cb58", baseurl: string = this.getBaseURL()): Promise<GetContainerRangeResponse[]> => {
      this.setBaseURL(baseurl)
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
     * Get index by containerID
     *
     * @param containerID
     * @param encoding 
     * @param baseurl
     *
     * @returns Returns a Promise<GetIndexResponse>.
     */
     getIndex = async (containerID: string = "", encoding: string = "cb58", baseurl: string = this.getBaseURL()): Promise<string> => {
      this.setBaseURL(baseurl)
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
     * Check if container is accepted
     *
     * @param containerID
     * @param encoding 
     * @param baseurl
     *
     * @returns Returns a Promise<GetIsAcceptedResponse>.
     */
     isAccepted = async (containerID: string = "", encoding: string = "cb58", baseurl: string = this.getBaseURL()): Promise<boolean> => {
       this.setBaseURL(baseurl)
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
