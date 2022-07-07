import { Credential as SepkCredential } from '../secp256k1/credential';

const _symbol = Symbol('nftfx.Credential');

export class Credential extends SepkCredential {
  _type = _symbol;
}
