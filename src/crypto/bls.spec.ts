import { stringToBytes } from '@scure/base';
import { hexToBuffer } from '../utils/buffer';
import {
  publicKeyFromBytes,
  publicKeyToBytes,
  secretKeyFromBytes,
  secretKeyToBytes,
  signatureFromBytes,
  signatureToBytes,
  verify,
  verifyProofOfPossession,
} from './bls';

const msgStr = 'test';
const skStr =
  '233428aaadf8a5d11ebba263d97b85a286750540f4abd04f109321e07b746277';
const pkStr =
  'adf6062df01fc18456140f7126567a84834d85b2af70454a7aacad932b92d0d7d0dab897d2f9bf46021511969f5b62f8';
const popStr =
  '98e8d8e33a51ecdcbcca2166370d99fdc02134e8e84ca34327cd2ec4412eb3b39619050a0146cba5d5948cb43c32a7f00f5df841700e3937d58b64e6f74493891b2a70402111841f69e9fc73236beb79f2e63e9a7caa55b724c61a139969ff57';
const sigStr =
  '9254acb2bfe4638daef4424b07f7a03987245c8945e634a7fca3302a2bb45e0aa9d2f8f5198e37d41aa65f8ab81efa4608d23ab55ccf06122f9718b37d42e0274297966191e3de2852f3a328727fe0dcced453c943405205b0f23038b7409e66';

describe('bls', () => {
  it('serializes correctly', async () => {
    const sk = secretKeyFromBytes(skStr);
    expect(secretKeyToBytes(sk)).toEqual(hexToBuffer(skStr));

    const pk = publicKeyFromBytes(pkStr);
    expect(publicKeyToBytes(pk)).toEqual(hexToBuffer(pkStr));

    const pk2 = publicKeyFromBytes(hexToBuffer(pkStr));
    expect(publicKeyToBytes(pk2)).toEqual(hexToBuffer(pkStr));

    const pop = signatureFromBytes(hexToBuffer(popStr));
    expect(signatureToBytes(pop)).toEqual(hexToBuffer(popStr));

    const sig = signatureFromBytes(hexToBuffer(sigStr));
    expect(signatureToBytes(sig)).toEqual(hexToBuffer(sigStr));
  });

  it('generates signature correctly', async () => {
    // TODO
  });

  it('verifies signature correctly', async () => {
    const pk = publicKeyFromBytes(pkStr);
    const sig = signatureFromBytes(hexToBuffer(sigStr));

    expect(verify(pk, sig, stringToBytes('utf8', msgStr))).toEqual(true);
  });

  it('generates proof of possession correctly', async () => {
    // TODO
  });

  it('verifies proof of possession correctly', async () => {
    const pk = publicKeyFromBytes(pkStr);
    const pop = signatureFromBytes(hexToBuffer(popStr));

    expect(verifyProofOfPossession(pk, pop, pk.toRawBytes())).toEqual(true);
  });
});
