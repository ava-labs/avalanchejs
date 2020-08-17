import { Buffer } from "buffer/";
import { PayloadTypes, BINPayload, PayloadBase, UTF8Payload, HEXSTRPayload, B58STRPayload, B64STRPayload, BIGNUMPayload, XCHAINADDRPayload, PCHAINADDRPayload, CCHAINADDRPayload, TXIDPayload, JSONPayload } from 'src/utils/payload';
import BinTools from 'src/utils/bintools';
import BN from "bn.js";
import * as bech32 from 'bech32';
let payloadTypes:PayloadTypes = PayloadTypes.getInstance();
let bintools = BinTools.getInstance()

describe("Payload", () => {
    let hrp:string = "tests";

    let cb58str:string = "MBcQpm1PsdfBKYscN3AYP56MusRDMZGF9";
    let cb58buf:string = bintools.bufferToB58(bintools.cb58Decode(cb58str));
    let chex:string = "849c0F8c6d9942a2605517AeaBe00133Cb159f8D";
    let bech:string = bech32.encode(hrp, bech32.toWords(bintools.b58ToBuffer(cb58buf)));
    let binstr:string = "Bx4v7ytutz3";
    let utf8str:string = "I am the very model of a modern Major-General.";
    let utf8b58:string = bintools.bufferToB58(Buffer.from(utf8str));
    let utf8hex:string = Buffer.from(utf8str).toString("hex");
    let utf8b64:string = Buffer.from(utf8str).toString("base64");
    let bnhex:string = "deadbeef";
    let svgstr:string = "<svg>hi mom</svg>";
    let csvstr:string = "1,2,3,4,5\neverybody,in the,house,come along, let's ride";
    let jsonobj:object = {boom:"goes the dynamite"};
    let yamlstr:string = "---\nrootproperty: blah\nsection:\n  one: two\n  three: four\n  Foo: Bar\n  empty: ~";
    let emailstr:string = "example@example.com";
    let urlstr:string = "https://example.com";
    let ipfsstr:string = "QmUy4jh5mGNZvLkjies1RWM4YuvJh5o2FYopNPVYwrRVGV";
    let onionstr:string = "https://el33th4xor.onion";
    let magnetstr:string = "magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a";

    

    test("PayloadTypes", () => {
        expect(() => {payloadTypes.select(867309)}).toThrow();

        expect(payloadTypes.lookupID("BIN")).toBe(0);

        let pl:BINPayload = payloadTypes.select(0, binstr) as BINPayload;

        expect(payloadTypes.getTypeID(pl.toBuffer())).toBe(0);

        let pp:Buffer = payloadTypes.getContent(pl.toBuffer());

        expect(bintools.b58ToBuffer(binstr).toString("hex")).toBe(pp.toString("hex"));
        expect(payloadTypes.lookupType(0)).toBe("BIN");
        expect(payloadTypes.recast(pl).toBuffer().toString("hex")).toBe(pl.toBuffer().toString("hex"));
    });

    let testTable = [
        ["BIN", binstr, binstr], 
        ["UTF8", utf8str, utf8b58], 
        ["HEXSTR", utf8hex, utf8b58], 
        ["B58STR", utf8b58, utf8b58], 
        ["B64STR", utf8b64, utf8b58], 
        ["BIGNUM", bnhex, bintools.bufferToB58(Buffer.from(bnhex, "hex"))], 
        ["XCHAINADDR", "X-" + bech, cb58buf], 
        ["PCHAINADDR", "P-" + bech, cb58buf], 
        ["CCHAINADDR", "C-0x" + chex, bintools.bufferToB58(Buffer.from(chex, "hex"))], 
        ["TXID", cb58str, cb58buf], 
        ["ASSETID", cb58str, cb58buf], 
        ["UTXOID",  cb58str, cb58buf], 
        ["NFTID", cb58str, cb58buf], 
        ["SUBNETID", cb58str, cb58buf], 
        ["CHAINID", cb58str, cb58buf], 
        ["NODEID", cb58str, cb58buf], 
        ["SECPSIG", cb58str, cb58str], 
        ["SECPENC", cb58str, cb58str], 
        ["JPEG", binstr, binstr], 
        ["PNG", binstr, binstr], 
        ["BMP", binstr, binstr], 
        ["ICO", binstr, binstr], 
        ["SVG", svgstr, bintools.bufferToB58(Buffer.from(svgstr))], 
        ["CSV", csvstr, bintools.bufferToB58(Buffer.from(csvstr))], 
        ["JSON", JSON.stringify(jsonobj), bintools.bufferToB58(Buffer.from(JSON.stringify(jsonobj)))], 
        ["YAML", yamlstr, bintools.bufferToB58(Buffer.from(yamlstr))], 
        ["EMAIL", emailstr, bintools.bufferToB58(Buffer.from(emailstr))], 
        ["URL", urlstr, bintools.bufferToB58(Buffer.from(urlstr))], 
        ["IPFS", ipfsstr, ipfsstr], 
        ["ONION", onionstr, bintools.bufferToB58(Buffer.from(onionstr))], 
        ["MAGNET", magnetstr, bintools.bufferToB58(Buffer.from(magnetstr))]
    ];
    test.each(testTable)(
        'Basic Payload Test: typestr %s; input %s; inputbuff %s',
        (
            typestr:string, inputstr:string, inputbuff:string
        ) => {
            let buff:Buffer = bintools.b58ToBuffer(inputbuff);
            let typeid:number = payloadTypes.lookupID(typestr);
            let typename:string = payloadTypes.lookupType(typeid);
            expect(typename).toBe(typestr);
            let c0:PayloadBase = payloadTypes.select(typeid);
            expect(c0.typeID()).toBe(typeid);
            expect(c0.typeName()).toBe(typename);
            let c1:PayloadBase = payloadTypes.select(typeid, buff);
            let c2:PayloadBase = payloadTypes.select(typeid, inputstr);
            let c3:PayloadBase = payloadTypes.select(typeid);
            c3.fromBuffer(c1.toBuffer());
            let c4:PayloadBase = payloadTypes.select(typeid);
            c4.fromBuffer(c2.toBuffer());
            
            let s1:string = c1.toBuffer().toString("hex");
            let s2:string = c2.toBuffer().toString("hex");
            let s3:string = c3.toBuffer().toString("hex");
            let s4:string = c4.toBuffer().toString("hex");

            expect(s1).toBe(s2);
            expect(s2).toBe(s3);
            expect(s3).toBe(s4);
        });

        test("BINPayload special cases", () => {
            let pl:BINPayload = payloadTypes.select(0, binstr) as BINPayload;
            expect(bintools.bufferToB58(pl.returnType())).toBe(binstr);
        });

        test("UTF8Payload special cases", () => {
            let pl:UTF8Payload = new UTF8Payload(utf8str);
            expect(pl.returnType()).toBe(utf8str);
        });

        test("HEXSTRPayload special cases", () => {
            let pl:HEXSTRPayload = new HEXSTRPayload(utf8hex);
            expect(pl.returnType()).toBe(utf8hex);
        });

        test("B58STRPayload special cases", () => {
            let pl:B58STRPayload = new B58STRPayload(utf8b58);
            expect(pl.returnType()).toBe(utf8b58);
        });

        test("B64STRPayload special cases", () => {
            let pl:B64STRPayload = new B64STRPayload(utf8b64);
            expect(pl.returnType()).toBe(utf8b64);
        });

        test("BIGNUMPayload special cases", () => {
            let jenny:BN = new BN(8675309);
            let pl:BIGNUMPayload = new BIGNUMPayload(jenny);
            expect(pl.returnType().toString("hex")).toBe(jenny.toString("hex"));
        });

        test("XCHAINADDRPayload special cases", () => {
            let addr:string = "X-" + bech;
            let pl:XCHAINADDRPayload = new XCHAINADDRPayload(addr);
            expect(pl.returnType(hrp)).toBe(addr);
            expect(pl.returnChainID()).toBe("X");
        });

        test("PCHAINADDRPayload special cases", () => {
            let addr:string = "P-" + bech;
            let pl:PCHAINADDRPayload = new PCHAINADDRPayload(addr);
            expect(pl.returnType(hrp)).toBe(addr);
            expect(pl.returnChainID()).toBe("P");
        });

        test("CCHAINADDRPayload special cases", () => {
            let addr:string = "C-0x" + chex;
            let pl:CCHAINADDRPayload = new CCHAINADDRPayload(addr);
            expect(pl.returnType()).toBe(addr);
            expect(pl.returnChainID()).toBe("C");
        });

        //handles all of cb58EncodedPayload
        test("TXIDPayload special cases", () => {
            let pl:TXIDPayload = new TXIDPayload(cb58str);
            expect(pl.returnType()).toBe(cb58str);
        });

        test("JSONPayload special cases", () => {
            let pl:JSONPayload = new JSONPayload(jsonobj);
            expect(JSON.stringify(pl.returnType())).toBe(JSON.stringify(jsonobj));
        });

});
