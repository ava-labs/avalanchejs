import { Codec, Manager } from '../../codec';
import * as NftFx from '../../fxs/nft';
import * as Secp256k1Fx from '../../fxs/secp256k1';

// https://github.com/ava-labs/avalanchego/blob/master/vms/avm/txs/parser.go
// https://github.com/ava-labs/avalanchego/blob/master/wallet/chain/x/constants.go
const manager = new Manager();
manager.RegisterCodec(
  0,
  new Codec([
    undefined, // TODO: BaseTx
    undefined, // TODO: CreateAssetTx
    undefined, // TODO: OperationTx
    undefined, // TODO: ImportTx
    undefined, // TODO: ExportTx
    ...Secp256k1Fx.TypeRegistry,
    ...NftFx.TypeRegistry,
    // TODO: ...PropertyFx.TypeRegistry,
  ]),
);

export { manager };
