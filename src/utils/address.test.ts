import { base58check } from './base58';
import { describe, it, expect } from 'vitest';

import { secp256k1 } from '../crypto';
import * as address from './address';

describe('address', () => {
  it('parses and formats correctly', async () => {
    const key = '24jUJ9vZexUM6expyMcT48LBx27k1m7xpraoV62oSQAHdziao5';
    const privKey = base58check.decode(key);
    const pubKey = secp256k1.getPublicKey(privKey);

    const addrBytes = secp256k1.publicKeyBytesToAddress(pubKey);

    const addr = address.format('X', 'avax', addrBytes);
    expect(addr).toEqual('X-avax1lnk637g0edwnqc2tn8tel39652fswa3xmgyghf');

    expect(address.parse(addr)).toEqual(['X', 'avax', addrBytes]);
  });
});
