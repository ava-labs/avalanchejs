import { Codec, Manager } from '../codec';
import * as NftFxs from '../fxs/nft';
import * as SecpFxs from '../fxs/secp256k1';

export const testCodec = new Codec([
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  SecpFxs.TransferInput,
  SecpFxs.MintOutput, // 6
  SecpFxs.TransferOutput, // 7
  undefined,
  undefined,
  NftFxs.MintOutput, //10
  NftFxs.TransferOutput, //11,
]);

export const testManager = new Manager();
testManager.RegisterCodec(0, testCodec);
