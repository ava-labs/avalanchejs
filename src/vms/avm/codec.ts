import { Codec, Manager } from '../../codec';
import { BaseTx } from '../../components/avax';
import * as NftFx from '../../fxs/nft';
import * as Secp256k1Fx from '../../fxs/secp256k1';
import { CreateAssetTx } from './createAssetTx';
import { ExportTx } from './exportTx';
import { ImportTx } from './importTx';
import { OperationTx } from './operationTx';

export const DEFAULT_CODEC_VERSION = 0;
// https://github.com/ava-labs/avalanchego/blob/master/vms/avm/txs/parser.go
// https://github.com/ava-labs/avalanchego/blob/master/wallet/chain/x/constants.go
let manager: Manager;

export const getManager = () => {
  if (manager) return manager;

  manager = new Manager();
  manager.RegisterCodec(
    0,
    new Codec([
      BaseTx,
      CreateAssetTx,
      OperationTx,
      ImportTx,
      ExportTx,
      ...Secp256k1Fx.TypeRegistry,
      ...NftFx.TypeRegistry,
      // TODO: ...PropertyFx.TypeRegistry,
    ]),
  );
  return manager;
};
