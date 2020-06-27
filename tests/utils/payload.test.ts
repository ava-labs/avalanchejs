import { Buffer } from "buffer/";
import { UTF8Payload, PayloadTypes, BINPayload, HEXSTRPayload, B58STRPayload, B64STRPayload, BIGNUMPayload, XCHAINPayload, PCHAINPayload, CCHAINPayload, TXIDPayload, ASSETIDPayload, UTXOIDPayload, NFTIDPayload, SUBNETIDPayload, CHAINIDPayload, NODEIDPayload, SECPSIGPayload, SECPENCPayload, JPEGPayload, PNGPayload, BMPPayload, ICOPayload, SVGPayload, CSVPayload, JSONPayload, PROTOBUFPayload, YAMLPayload, EMAILPayload, URLPayload, IPFSPayload, ONIONPayload, MAGNETPayload } from "src";
let payloadTypes:PayloadTypes = PayloadTypes.getInstance();

describe("Payload", () => {
    test("PayloadTypes", () => {
        expect(payloadTypes.lookupID("BIN")).toBe(0);
        expect(payloadTypes.lookupType(0)).toBe("BIN");
    });

    test("BINPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str);
        let binp:BINPayload = new BINPayload(serialized);
        let binpbuf:Buffer = binp.toBuffer();

        expect(binp.typeID()).toBe(0);
        expect(binp.typeName()).toBe("BIN");

        let binPayload:BINPayload = new BINPayload();
        expect(payloadTypes.select(0).toBuffer().toString()).toBe(binPayload.toBuffer().toString());
        // TODO
        // how to best test returnType() ?
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
        expect(payloadTypes.select(1).toBuffer().toString()).toBe(utf8pcopy.toBuffer().toString());
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

        let hexpcopy:HEXSTRPayload = new HEXSTRPayload();
        expect(payloadTypes.select(2).toBuffer().toString()).toBe(hexpcopy.toBuffer().toString());
    });

    test("B58STRPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let b58:B58STRPayload = new B58STRPayload(serialized);

        expect(b58.typeID()).toBe(3);
        expect(b58.typeName()).toBe("B58STR");

        let b58copy:B58STRPayload = new B58STRPayload();
        expect(payloadTypes.select(3).toBuffer().toString()).toBe(b58copy.toBuffer().toString());
    });

    test("B64STRPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let b64:B64STRPayload = new B64STRPayload(serialized);

        expect(b64.typeID()).toBe(4);
        expect(b64.typeName()).toBe("B64STR");

        let b64copy:B64STRPayload = new B64STRPayload();
        expect(payloadTypes.select(4).toBuffer().toString()).toBe(b64copy.toBuffer().toString());
    });

    test("BIGNUMPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let bn:BIGNUMPayload = new BIGNUMPayload(serialized);

        expect(bn.typeID()).toBe(5);
        expect(bn.typeName()).toBe("BIGNUM");

        let bncopy:BIGNUMPayload = new BIGNUMPayload();
        expect(payloadTypes.select(5).toBuffer().toString()).toBe(bncopy.toBuffer().toString());
    });

    test("XCHAINPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let x:XCHAINPayload = new XCHAINPayload(serialized);

        expect(x.typeID()).toBe(6);
        expect(x.returnChainID()).toBe("X");
        expect(x.typeName()).toBe("XCHAINADDR");

        let xcopy:XCHAINPayload = new XCHAINPayload();
        expect(payloadTypes.select(6).toBuffer().toString()).toBe(xcopy.toBuffer().toString());
    });

    test("PCHAINPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let p:PCHAINPayload = new PCHAINPayload(serialized);

        expect(p.typeID()).toBe(7);
        expect(p.returnChainID()).toBe("P");
        expect(p.typeName()).toBe("PCHAINADDR");

        let pcopy:PCHAINPayload = new PCHAINPayload();
        expect(payloadTypes.select(7).toBuffer().toString()).toBe(pcopy.toBuffer().toString());
    });

    test("CCHAINPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let c:CCHAINPayload = new CCHAINPayload(serialized);

        expect(c.typeID()).toBe(8);
        expect(c.returnChainID()).toBe("C");
        expect(c.typeName()).toBe("CCHAINADDR");

        let ccopy:CCHAINPayload = new CCHAINPayload();
        expect(payloadTypes.select(8).toBuffer().toString()).toBe(ccopy.toBuffer().toString());
    });

    test("TXIDPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let txid:TXIDPayload = new TXIDPayload(serialized);

        expect(txid.typeID()).toBe(9);
        expect(txid.typeName()).toBe("TXID");

        let txidcopy:TXIDPayload = new TXIDPayload();
        expect(payloadTypes.select(9).toBuffer().toString()).toBe(txidcopy.toBuffer().toString());
    });

    test("ASSETIDPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let assetid:ASSETIDPayload = new ASSETIDPayload(serialized);

        expect(assetid.typeID()).toBe(10);
        expect(assetid.typeName()).toBe("ASSETID");

        let assetidcopy:ASSETIDPayload = new ASSETIDPayload();
        expect(payloadTypes.select(10).toBuffer().toString()).toBe(assetidcopy.toBuffer().toString());
    });

    test("UTXOIDPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let utxoid:UTXOIDPayload = new UTXOIDPayload(serialized);

        expect(utxoid.typeID()).toBe(11);
        expect(utxoid.typeName()).toBe("UTXOID");

        let utxoidcopy:UTXOIDPayload = new UTXOIDPayload();
        expect(payloadTypes.select(11).toBuffer().toString()).toBe(utxoidcopy.toBuffer().toString());
    });

    test("NFTIDPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let nftid:NFTIDPayload = new NFTIDPayload(serialized);

        expect(nftid.typeID()).toBe(12);
        expect(nftid.typeName()).toBe("NFTID");

        let nftidcopy:NFTIDPayload = new NFTIDPayload();
        expect(payloadTypes.select(12).toBuffer().toString()).toBe(nftidcopy.toBuffer().toString());
    });

    test("SUBNETIDPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let subnetid:SUBNETIDPayload = new SUBNETIDPayload(serialized);

        expect(subnetid.typeID()).toBe(13);
        expect(subnetid.typeName()).toBe("SUBNETID");

        let subnetidcopy:SUBNETIDPayload = new SUBNETIDPayload();
        expect(payloadTypes.select(13).toBuffer().toString()).toBe(subnetidcopy.toBuffer().toString());
    });

    test("CHAINIDPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let chainid:CHAINIDPayload = new CHAINIDPayload(serialized);

        expect(chainid.typeID()).toBe(14);
        expect(chainid.typeName()).toBe("CHAINID");

        let chainidcopy:CHAINIDPayload = new CHAINIDPayload();
        expect(payloadTypes.select(14).toBuffer().toString()).toBe(chainidcopy.toBuffer().toString());
    });

    test("NODEIDPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let nodeid:NODEIDPayload = new NODEIDPayload(serialized);

        expect(nodeid.typeID()).toBe(15);
        expect(nodeid.typeName()).toBe("NODEID");

        let nodeidcopy:NODEIDPayload = new NODEIDPayload();
        expect(payloadTypes.select(15).toBuffer().toString()).toBe(nodeidcopy.toBuffer().toString());
    });

    test("SECPSIGPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let secpsig:SECPSIGPayload = new SECPSIGPayload(serialized);

        expect(secpsig.typeID()).toBe(16);
        expect(secpsig.typeName()).toBe("SECPSIG");

        let secpsigcopy:SECPSIGPayload = new SECPSIGPayload();
        expect(payloadTypes.select(16).toBuffer().toString()).toBe(secpsigcopy.toBuffer().toString());
    });

    test("SECPENCPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let secpenc:SECPENCPayload = new SECPENCPayload(serialized);

        expect(secpenc.typeID()).toBe(17);
        expect(secpenc.typeName()).toBe("SECPENC");

        let secpenccopy:SECPENCPayload = new SECPENCPayload();
        expect(payloadTypes.select(17).toBuffer().toString()).toBe(secpenccopy.toBuffer().toString());
    });

    test("JPEGPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let jpeg:JPEGPayload = new JPEGPayload(serialized);

        expect(jpeg.typeID()).toBe(18);
        expect(jpeg.typeName()).toBe("JPEG");

        let jpegcopy:JPEGPayload = new JPEGPayload();
        expect(payloadTypes.select(18).toBuffer().toString()).toBe(jpegcopy.toBuffer().toString());
    });

    test("PNGPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let png:PNGPayload = new PNGPayload(serialized);

        expect(png.typeID()).toBe(19);
        expect(png.typeName()).toBe("PNG");

        let pngcopy:PNGPayload = new PNGPayload();
        expect(payloadTypes.select(19).toBuffer().toString()).toBe(pngcopy.toBuffer().toString());
    });

    test("BMPPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let bmp:BMPPayload = new BMPPayload(serialized);

        expect(bmp.typeID()).toBe(20);
        expect(bmp.typeName()).toBe("BMP");

        let bmpcopy:BMPPayload = new BMPPayload();
        expect(payloadTypes.select(20).toBuffer().toString()).toBe(bmpcopy.toBuffer().toString());
    });

    test("ICOPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let ico:ICOPayload = new ICOPayload(serialized);

        expect(ico.typeID()).toBe(21);
        expect(ico.typeName()).toBe("ICO");

        let icocopy:ICOPayload = new ICOPayload();
        expect(payloadTypes.select(21).toBuffer().toString()).toBe(icocopy.toBuffer().toString());
    });

    test("SVGPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let svg:SVGPayload = new SVGPayload(serialized);

        expect(svg.typeID()).toBe(22);
        expect(svg.typeName()).toBe("SVG");

        let svgcopy:SVGPayload = new SVGPayload();
        expect(payloadTypes.select(22).toBuffer().toString()).toBe(svgcopy.toBuffer().toString());
    });

    test("CSVPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let csv:CSVPayload = new CSVPayload(serialized);

        expect(csv.typeID()).toBe(23);
        expect(csv.typeName()).toBe("CSV");

        let csvcopy:CSVPayload = new CSVPayload();
        expect(payloadTypes.select(23).toBuffer().toString()).toBe(csvcopy.toBuffer().toString());
    });

    test("JSONPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let json:JSONPayload = new JSONPayload(serialized);

        expect(json.typeID()).toBe(24);
        expect(json.typeName()).toBe("JSON");

        let jsoncopy:JSONPayload = new JSONPayload();
        expect(payloadTypes.select(24).toBuffer().toString()).toBe(jsoncopy.toBuffer().toString());
    });

    test("PROTOBUFPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let protobuf:PROTOBUFPayload = new PROTOBUFPayload(serialized);

        expect(protobuf.typeID()).toBe(25);
        expect(protobuf.typeName()).toBe("PROTOBUF");

        let protobufcopy:PROTOBUFPayload = new PROTOBUFPayload();
        expect(payloadTypes.select(25).toBuffer().toString()).toBe(protobufcopy.toBuffer().toString());
    });

    test("YAMLPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let yaml:YAMLPayload = new YAMLPayload(serialized);

        expect(yaml.typeID()).toBe(26);
        expect(yaml.typeName()).toBe("YAML");

        let yamlcopy:YAMLPayload = new YAMLPayload();
        expect(payloadTypes.select(26).toBuffer().toString()).toBe(yamlcopy.toBuffer().toString());
    });

    test("EMAILPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let email:EMAILPayload = new EMAILPayload(serialized);

        expect(email.typeID()).toBe(27);
        expect(email.typeName()).toBe("EMAIL");

        let emailcopy:EMAILPayload = new EMAILPayload();
        expect(payloadTypes.select(27).toBuffer().toString()).toBe(emailcopy.toBuffer().toString());
    });

    test("URLPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let url:URLPayload = new URLPayload(serialized);

        expect(url.typeID()).toBe(28);
        expect(url.typeName()).toBe("URL");

        let urlcopy:URLPayload = new URLPayload();
        expect(payloadTypes.select(28).toBuffer().toString()).toBe(urlcopy.toBuffer().toString());
    });

    test("IPFSPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let ipfs:IPFSPayload = new IPFSPayload(serialized);

        expect(ipfs.typeID()).toBe(29);
        expect(ipfs.typeName()).toBe("IPFS");

        let ipfscopy:IPFSPayload = new IPFSPayload();
        expect(payloadTypes.select(29).toBuffer().toString()).toBe(ipfscopy.toBuffer().toString());
    });

    test("ONIONPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let onion:ONIONPayload = new ONIONPayload(serialized);

        expect(onion.typeID()).toBe(30);
        expect(onion.typeName()).toBe("ONION");

        let onioncopy:ONIONPayload = new ONIONPayload();
        expect(payloadTypes.select(30).toBuffer().toString()).toBe(onioncopy.toBuffer().toString());
    });

    test("MAGNETPayload", () => {
        let str:string = "Avalanche.js";
        let serialized:Buffer = Buffer.from(str)
        let magnet:MAGNETPayload = new MAGNETPayload(serialized);

        expect(magnet.typeID()).toBe(31);
        expect(magnet.typeName()).toBe("MAGNET");

        let magnetcopy:MAGNETPayload = new MAGNETPayload();
        expect(payloadTypes.select(31).toBuffer().toString()).toBe(magnetcopy.toBuffer().toString());
    });
});