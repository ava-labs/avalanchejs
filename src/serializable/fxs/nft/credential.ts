import { Credential as SepkCredential } from '../secp256k1/credential';
import { TypeSymbols } from '../../constants';

export class Credential extends SepkCredential {
  _type = TypeSymbols.NftFxCredential;
}
