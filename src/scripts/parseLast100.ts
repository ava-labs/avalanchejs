import type { SignedTx } from '../serializable/avax';
import { AVMApi } from '../vms/avm';
import { EVMApi } from '../vms/evm';
import { PVMApi } from '../vms/pvm/api';
import type { GetTxServerResponse } from '../vms/pvm/privateModels';
const XChainID = '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM';
const PChainID = '11111111111111111111111111111111LpoYY';
const CChainID = '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5';
export const parseLast = async (limit = 25) => {
  const results = await fetch(
    `https://explorerapi.avax.network/v2/transactions?sort=timestamp-desc&limit=${limit.toString()}`,
  ).then(
    (resp) =>
      resp.json() as Promise<{
        transactions: { id: string; chainID: string }[];
      }>,
  );
  const getTxFunc = {
    [XChainID]: new AVMApi().getTx,
    [PChainID]: new PVMApi().getTx,
    [CChainID]: new EVMApi().getAtomicTx,
  };

  const getTxJSONFunc = {
    [XChainID]: new AVMApi().getTxJson,
    [PChainID]: new PVMApi().getTxJson,
  };
  results.transactions.forEach(async ({ chainID, id }, i) => {
    try {
      const tx: SignedTx = await getTxFunc[chainID]({ txID: id });

      if (chainID in getTxJSONFunc) {
        const txJSON: GetTxServerResponse = await getTxJSONFunc[chainID]({
          txID: id,
        });
        const jsonSigs = txJSON.tx.credentials.reduce((agg, credential) => {
          return agg.concat(
            credential.signatures ?? credential.credential.signatures,
          );
        }, [] as string[]);
        const parsedSigs = tx.getAllSignatures();
        if (!sigsEqual(parsedSigs, jsonSigs)) {
          console.log('jsonSigs=', jsonSigs);
          console.log('parsedSigs=', parsedSigs);

          throw new Error("sigs don't match");
        }
      }
    } catch (e) {
      console.log('chainID=', chainID);
      console.log('id=', id);
      console.log('e=', e);
    } finally {
      if (i % 100 === 0) {
        console.log(`${i} success`);
      }
    }
  });
};

const sigsEqual = (sigs1: string[], sigs2: string[]) => {
  if (sigs1.length !== sigs2.length) {
    return false;
  }
  return sigs1.every((sig, idx) => sig === sigs2[idx]);
};
