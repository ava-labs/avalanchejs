import { Codec, Manager } from '../codec';
import * as NftFx from '../fxs/nft';
import * as Secp256k1Fx from '../fxs/secp256k1';

// Check for circular imports in the fx type
// registries if tests are throwing errors
export const testCodec = () =>
  new Codec([
    ...Array(5).fill(undefined),
    ...Secp256k1Fx.TypeRegistry,
    ...NftFx.TypeRegistry,
  ]);

export const testManager = new Manager();
testManager.RegisterCodec(0, testCodec());
