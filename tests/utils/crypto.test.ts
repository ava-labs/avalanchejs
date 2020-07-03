import { Buffer } from "buffer/";
import {CryptoHelpers} from "src/utils/crypto";

describe("CryptoHelpers", () => {
    test("encrypt and decrypt", async () => {
        let pw:string = "password12345";
        let ch:CryptoHelpers = new CryptoHelpers();

        let msg:string = "I am the very model of a modern major general";
        let resp:{salt: Buffer; iv: Buffer; ciphertext: Buffer} = await ch.encrypt(pw, msg);
        let pt1:Buffer = await ch.decrypt(pw, resp.ciphertext, resp.salt, resp.iv);
        expect(pt1.toString("utf8")).toBe(msg);

        let resp2:{salt: Buffer; iv: Buffer; ciphertext: Buffer} = await ch.encrypt(pw, msg, resp.salt);
        let pt2:Buffer = await ch.decrypt(pw, resp2.ciphertext, resp2.salt, resp2.iv);
        expect(pt2.toString("utf8")).toBe(msg);
    });

    test("pwhash", async () => {
        let pw:string = "password12345";
        let ch:CryptoHelpers = new CryptoHelpers();
        let salt:Buffer = await ch.makeSalt();

        let ph1:{salt: Buffer; hash: Buffer} = await ch.pwhash(pw, salt);
        
        let sha:Buffer = Buffer.from(await ch._pwcleaner(pw, salt));
        expect(sha.toString("hex")).toBe(ph1.hash.toString("hex"));

    });
});