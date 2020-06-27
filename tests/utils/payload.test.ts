import { Buffer } from "buffer/";
import { UTF8Payload, PayloadTypes, BINPayload } from "src";

describe("Payload", () => {
    // beforeAll(() => {
    //     let payloadTypes:PayloadTypes;
    // });
    test("PayloadTypes", () => {
        let payloadTypes:PayloadTypes = PayloadTypes.getInstance();
        expect(payloadTypes.lookupID("BIN")).toBe(0);
        expect(payloadTypes.lookupType(0)).toBe("BIN");
        let binPayload:BINPayload = new BINPayload();
        expect(payloadTypes.select(0).toBuffer().toString()).toBe(binPayload.toBuffer().toString());
    });

    test("UTF8Payload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let utf8p:UTF8Payload = new UTF8Payload(serialized);
        let utf8pbuf:Buffer = utf8p.toBuffer();

        expect(utf8p.typeID()).toBe(1);
        expect(utf8p.typeName()).toBe("UTF8");
        expect(utf8p.returnType()).toBe(str);

        let utf8pcopy:UTF8Payload = new UTF8Payload();
        utf8pcopy.fromBuffer(utf8pbuf);
        expect(utf8pcopy.toString()).toBe(utf8p.toString());
        expect(utf8p.toBuffer().toString()).toBe(utf8pcopy.toBuffer().toString());
    });
});