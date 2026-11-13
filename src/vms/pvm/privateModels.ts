/* 
  models in this file are intermediate and not meant to be exported externally
*/

export interface GetRewardUTXOsServerResponse {
  numFetched: number;
  utxos: string[];
}

export interface GetTxServerResponse {
  tx: any;
}
