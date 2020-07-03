import { Buffer } from 'buffer/';
import CryptoHelpers from 'src/utils/crypto';

describe('CryptoHelpers', () => {
  test('encrypt and decrypt', async () => {
    const pw:string = 'password12345';
    const ch:CryptoHelpers = new CryptoHelpers();

    const msg:string = 'I am the very model of a modern major general';
    const resp:{salt: Buffer; iv: Buffer; ciphertext: Buffer} = await ch.encrypt(pw, msg);
    const pt1:Buffer = await ch.decrypt(pw, resp.ciphertext, resp.salt, resp.iv);
    expect(pt1.toString('utf8')).toBe(msg);

    const resp2:{salt: Buffer; iv: Buffer; ciphertext: Buffer} = await ch.encrypt(pw, msg, resp.salt);
    const pt2:Buffer = await ch.decrypt(pw, resp2.ciphertext, resp2.salt, resp2.iv);
    expect(pt2.toString('utf8')).toBe(msg);
  });

  test('pwhash', async () => {
    const pw:string = 'password12345';
    const ch:CryptoHelpers = new CryptoHelpers();
    const salt:Buffer = await ch.makeSalt();

    const ph1:{salt: Buffer; hash: Buffer} = await ch.pwhash(pw, salt);

    const sha:Buffer = Buffer.from(await ch._pwcleaner(pw, salt));
    expect(sha.toString('hex')).toBe(ph1.hash.toString('hex'));
  });
});
