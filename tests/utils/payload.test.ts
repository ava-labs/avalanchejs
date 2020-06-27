import { Buffer } from "buffer/";
import { UTF8Payload, PayloadTypes, BINPayload, HEXSTRPayload, B58STRPayload, B64STRPayload, BIGNUMPayload, XCHAINPayload, PCHAINPayload, CCHAINPayload, TXIDPayload, ASSETIDPayload, UTXOIDPayload, NFTIDPayload, SUBNETIDPayload, CHAINIDPayload, NODEIDPayload, SECPSIGPayload, SECPENCPayload, JPEGPayload, PNGPayload, BMPPayload, ICOPayload, SVGPayload, CSVPayload, JSONPayload, PROTOBUFPayload, YAMLPayload } from "src";

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
        let hexp:HEXSTRPayload = new HEXSTRPayload(serialized);

        expect(hexp.typeID()).toBe(2);
        expect(hexp.typeName()).toBe("HEXSTR");
    });

    test("B58STRPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let b58:B58STRPayload = new B58STRPayload(serialized);

        expect(b58.typeID()).toBe(3);
        expect(b58.typeName()).toBe("B58STR");
    });

    test("B64STRPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let b64:B64STRPayload = new B64STRPayload(serialized);

        expect(b64.typeID()).toBe(4);
        expect(b64.typeName()).toBe("B64STR");
    });

    test("BIGNUMPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let bn:BIGNUMPayload = new BIGNUMPayload(serialized);

        expect(bn.typeID()).toBe(5);
        expect(bn.typeName()).toBe("BIGNUM");
    });

    test("XCHAINPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let x:XCHAINPayload = new XCHAINPayload(serialized);

        expect(x.typeID()).toBe(6);
        expect(x.returnChainID()).toBe("X");
        expect(x.typeName()).toBe("XCHAINADDR");
    });

    test("PCHAINPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let p:PCHAINPayload = new PCHAINPayload(serialized);

        expect(p.typeID()).toBe(7);
        expect(p.returnChainID()).toBe("P");
        expect(p.typeName()).toBe("PCHAINADDR");
    });

    test("CCHAINPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let c:CCHAINPayload = new CCHAINPayload(serialized);

        expect(c.typeID()).toBe(8);
        expect(c.returnChainID()).toBe("C");
        expect(c.typeName()).toBe("CCHAINADDR");
    });

    test("TXIDPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let txid:TXIDPayload = new TXIDPayload(serialized);

        expect(txid.typeID()).toBe(9);
        expect(txid.typeName()).toBe("TXID");
    });

    test("ASSETIDPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let assetid:ASSETIDPayload = new ASSETIDPayload(serialized);

        expect(assetid.typeID()).toBe(10);
        expect(assetid.typeName()).toBe("ASSETID");
    });

    test("UTXOIDPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let utxoid:UTXOIDPayload = new UTXOIDPayload(serialized);

        expect(utxoid.typeID()).toBe(11);
        expect(utxoid.typeName()).toBe("UTXOID");
    });

    test("NFTIDPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let nftid:NFTIDPayload = new NFTIDPayload(serialized);

        expect(nftid.typeID()).toBe(12);
        expect(nftid.typeName()).toBe("NFTID");
    });

    test("SUBNETIDPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let subnetid:SUBNETIDPayload = new SUBNETIDPayload(serialized);

        expect(subnetid.typeID()).toBe(13);
        expect(subnetid.typeName()).toBe("SUBNETID");
    });

    test("CHAINIDPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let chainid:CHAINIDPayload = new CHAINIDPayload(serialized);

        expect(chainid.typeID()).toBe(14);
        expect(chainid.typeName()).toBe("CHAINID");
    });

    test("NODEIDPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let nodeid:NODEIDPayload = new NODEIDPayload(serialized);

        expect(nodeid.typeID()).toBe(15);
        expect(nodeid.typeName()).toBe("NODEID");
    });

    test("SECPSIGPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let secpsig:SECPSIGPayload = new SECPSIGPayload(serialized);

        expect(secpsig.typeID()).toBe(16);
        expect(secpsig.typeName()).toBe("SECPSIG");
    });

    test("SECPENCPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let secpenc:SECPENCPayload = new SECPENCPayload(serialized);

        expect(secpenc.typeID()).toBe(17);
        expect(secpenc.typeName()).toBe("SECPENC");
    });

    test("JPEGPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let jpeg:JPEGPayload = new JPEGPayload(serialized);

        expect(jpeg.typeID()).toBe(18);
        expect(jpeg.typeName()).toBe("JPEG");
    });

    test("PNGPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let png:PNGPayload = new PNGPayload(serialized);

        expect(png.typeID()).toBe(19);
        expect(png.typeName()).toBe("PNG");
    });

    test("BMPPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let bmp:BMPPayload = new BMPPayload(serialized);

        expect(bmp.typeID()).toBe(20);
        expect(bmp.typeName()).toBe("BMP");
    });

    test("ICOPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let ico:ICOPayload = new ICOPayload(serialized);

        expect(ico.typeID()).toBe(21);
        expect(ico.typeName()).toBe("ICO");
    });

    test("SVGPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let svg:SVGPayload = new SVGPayload(serialized);

        expect(svg.typeID()).toBe(22);
        expect(svg.typeName()).toBe("SVG");
    });

    test("CSVPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let csv:CSVPayload = new CSVPayload(serialized);

        expect(csv.typeID()).toBe(23);
        expect(csv.typeName()).toBe("CSV");
    });

    test("JSONPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let json:JSONPayload = new JSONPayload(serialized);

        expect(json.typeID()).toBe(24);
        expect(json.typeName()).toBe("JSON");
    });

    test("PROTOBUFPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let protobuf:PROTOBUFPayload = new PROTOBUFPayload(serialized);

        expect(protobuf.typeID()).toBe(25);
        expect(protobuf.typeName()).toBe("PROTOBUF");
    });

    test("YAMLPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let yaml:YAMLPayload = new YAMLPayload(serialized);

        expect(yaml.typeID()).toBe(26);
        expect(yaml.typeName()).toBe("YAML");
    });
});