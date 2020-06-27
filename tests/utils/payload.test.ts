import { Buffer } from "buffer/";
import { UTF8Payload, PayloadTypes, BINPayload, HEXSTRPayload, B58STRPayload, B64STRPayload, BIGNUMPayload, XCHAINPayload } from "src";

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

    test("BINPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str);
        let binp:BINPayload = new BINPayload(serialized);
        let utf8pbuf:Buffer = binp.toBuffer();

        expect(binp.typeID()).toBe(0);
        expect(binp.typeName()).toBe("BIN");
        // TODO
        // expect(binp.returnType()).toBe(str);
        // let utf8pcopy:BINPayload = new BINPayload();
        // utf8pcopy.fromBuffer(utf8pbuf);
        // expect(utf8pcopy.toString()).toBe(binp.toString());
        // expect(binp.toBuffer().toString()).toBe(utf8pcopy.toBuffer().toString());
    });

    test("UTF8Payload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str, "utf8");
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

    test("HEXSTRPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let utf8p:HEXSTRPayload = new HEXSTRPayload(serialized);
        let utf8pbuf:Buffer = utf8p.toBuffer();

        expect(utf8p.typeID()).toBe(2);
        expect(utf8p.typeName()).toBe("HEXSTR");
    });

    test("B58STRPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let utf8p:B58STRPayload = new B58STRPayload(serialized);
        let utf8pbuf:Buffer = utf8p.toBuffer();

        expect(utf8p.typeID()).toBe(3);
        expect(utf8p.typeName()).toBe("B58STR");
    });

    test("B64STRPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let utf8p:B64STRPayload = new B64STRPayload(serialized);
        let utf8pbuf:Buffer = utf8p.toBuffer();

        expect(utf8p.typeID()).toBe(4);
        expect(utf8p.typeName()).toBe("B64STR");
    });

    test("BIGNUMPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let utf8p:BIGNUMPayload = new BIGNUMPayload(serialized);
        let utf8pbuf:Buffer = utf8p.toBuffer();

        expect(utf8p.typeID()).toBe(5);
        expect(utf8p.typeName()).toBe("BIGNUM");
    });

    test("XCHAINPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let utf8p:XCHAINPayload = new XCHAINPayload(serialized);
        let utf8pbuf:Buffer = utf8p.toBuffer();

        expect(utf8p.typeID()).toBe(6);
        expect(utf8p.typeName()).toBe("XCHAINADDR");
    });
});