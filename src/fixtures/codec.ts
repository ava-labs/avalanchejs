import { Codec, Manager } from '../codec';
import * as NftFx from '../fxs/nft/fx';
import * as Secp256k1Fx from '../fxs/secp256k1/fx';

export const testCodec = () =>
  new Codec([
    ...Array(5).fill(undefined),
    ...Secp256k1Fx.TypeRegistryCodec0(),
    ...NftFx.TypeRegistryCodec0(),
  ]);

export const testManager = new Manager();
testManager.RegisterCodec(0, testCodec());
