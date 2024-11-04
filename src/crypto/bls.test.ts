import { stringToBytes } from '@scure/base';
import { describe, it, expect } from 'vitest';

import { hexToBuffer } from '../utils/buffer';
import * as bls from './bls';

const msg = stringToBytes('utf8', 'test');
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
    const sk = bls.secretKeyFromBytes(skStr);
    expect(bls.secretKeyToBytes(sk)).toEqual(hexToBuffer(skStr));

    const pk = bls.publicKeyFromBytes(pkStr);
    expect(bls.publicKeyToBytes(pk)).toEqual(hexToBuffer(pkStr));

    const pk2 = bls.publicKeyFromBytes(hexToBuffer(pkStr));
    expect(bls.publicKeyToBytes(pk2)).toEqual(hexToBuffer(pkStr));

    const pop = bls.signatureFromBytes(hexToBuffer(popStr));
    expect(bls.signatureToBytes(pop)).toEqual(hexToBuffer(popStr));

    const sig = bls.signatureFromBytes(hexToBuffer(sigStr));
    expect(bls.signatureToBytes(sig)).toEqual(hexToBuffer(sigStr));
  });

  it('generates signature correctly', async () => {
    const sk = bls.secretKeyFromBytes(skStr);
    expect(bls.sign(msg, sk)).toEqual(hexToBuffer(sigStr));
  });

  it('verifies signature correctly', async () => {
    const pk = bls.publicKeyFromBytes(pkStr);
    const sig = bls.signatureFromBytes(hexToBuffer(sigStr));

    expect(bls.verify(pk, sig, msg)).toEqual(true);
  });

  it('generates proof of possession correctly', async () => {
    const sk = bls.secretKeyFromBytes(skStr);
    const pk = bls.publicKeyFromBytes(pkStr);
    const pkBytes = bls.publicKeyToBytes(pk);

    expect(bls.signProofOfPossession(pkBytes, sk)).toEqual(hexToBuffer(popStr));
  });

  it('verifies proof of possession correctly', async () => {
    const pk = bls.publicKeyFromBytes(pkStr);
    const pop = bls.signatureFromBytes(hexToBuffer(popStr));
    const pkBytes = bls.publicKeyToBytes(pk);

    expect(bls.verifyProofOfPossession(pk, pop, pkBytes)).toEqual(true);
  });
});
