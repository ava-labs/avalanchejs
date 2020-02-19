import { Buffer } from "buffer/";
import {CryptoHelpers} from "src/utils/crypto";

describe("CryptoHelpers", () => {
    test("instantiation and vars", () => {
        let ch:CryptoHelpers = new CryptoHelpers();
        
        let ml = ch.getMemoryLimit();
        ch.setMemoryLimit(400);
        let mlupdated = ch.getMemoryLimit();
        
        expect(ml).not.toBe(mlupdated);

        let ol = ch.getOpsLimit();
        ch.setOpsLimit(1);
        let olupdated = ch.getOpsLimit();

        expect(ol).not.toBe(olupdated);
    });
    test("encrypt and decrypt", async () => {
        let pw:string = "password12345";
        let ch:CryptoHelpers = new CryptoHelpers();

        let msg:string = "I am the very model of a modern major general";
        let resp:{salt: Buffer; nonce: Buffer; ciphertext: Buffer} = await ch.encrypt(pw, msg);
        let pt1:Buffer = await ch.decrypt(pw, resp.ciphertext, resp.salt, resp.nonce);
        expect(pt1.toString("utf8")).toBe(msg);

        let resp2:{salt: Buffer; nonce: Buffer; ciphertext: Buffer} = await ch.encrypt(pw, msg, resp.salt);
        let pt2:Buffer = await ch.decrypt(pw, resp2.ciphertext, resp2.salt, resp2.nonce);
        expect(pt2.toString("utf8")).toBe(msg);
    });

    test("pwhash", async () => {
        let pw:string = "password12345";
        let ch:CryptoHelpers = new CryptoHelpers();
        let salt:Buffer = await ch.makeSalt();

        let ph1:{salt: Buffer; hash: Buffer} = await ch.pwhash(pw, salt);
        
        let sha:Buffer = Buffer.from(await ch._pwcleaner(pw, salt));
        expect(sha.toString("hex")).not.toBe(ph1.hash.toString("hex"))
    });
});