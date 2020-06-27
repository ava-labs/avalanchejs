import { Buffer } from "buffer/";
import { UTF8Payload } from "src";

let serialized:Buffer = Buffer.from("Avalanche.js")

describe("Payload", () => {
    test("", () => {
        let utf8p:UTF8Payload = new UTF8Payload(serialized);
        let utf8pbuf:Buffer = utf8p.toBuffer();
        let utf8pcopy:UTF8Payload = new UTF8Payload();
        utf8pcopy.fromBuffer(utf8pbuf);
        expect(utf8pcopy.toString()).toBe(utf8p.toString());
    });
});