import { Buffer } from "buffer/";
import { UTF8Payload, PayloadTypes, BINPayload, HEXSTRPayload, B58STRPayload, B64STRPayload, BIGNUMPayload, XCHAINPayload, PCHAINPayload, CCHAINPayload, TXIDPayload, ASSETIDPayload, UTXOIDPayload, NFTIDPayload, SUBNETIDPayload, CHAINIDPayload, NODEIDPayload, SECPSIGPayload, SECPENCPayload, JPEGPayload, PNGPayload, BMPPayload, ICOPayload, SVGPayload, CSVPayload, JSONPayload, PROTOBUFPayload, YAMLPayload, EMAILPayload, URLPayload, IPFSPayload, ONIONPayload, MAGNETPayload } from "src";
import BinTools from '../../src/utils/bintools';
import BN from "bn.js";
let payloadTypes:PayloadTypes = PayloadTypes.getInstance();
let bintools = BinTools.getInstance();

describe("Payload", () => {
    test("PayloadTypes", () => {
        expect(payloadTypes.lookupID("BIN")).toBe(0);
        expect(payloadTypes.lookupType(0)).toBe("BIN");
    });

    test("BINPayload", () => {
        const bin:string = "01000001 01110110 01100001 01101100 01100001 01101110 01100011 01101000 01100101 00100000 01101001 01110011 00100000 01100001 01101110 00100000 01101111 01110000 01100101 01101110 00101101 01110011 01101111 01110101 01110010 01100011 01100101 00100000 01110000 01101100 01100001 01110100 01100110 01101111 01110010 01101101 00100000 01100110 01101111 01110010 00100000 01101100 01100001 01110101 01101110 01100011 01101000 01101001 01101110 01100111 00100000 01101000 01101001 01100111 01101000 01101100 01111001 00100000 01100100 01100101 01100011 01100101 01101110 01110100 01110010 01100001 01101100 01101001 01111010 01100101 01100100 00100000 01100001 01110000 01110000 01101100 01101001 01100011 01100001 01110100 01101001 01101111 01101110 01110011 00101100 00100000 01101110 01100101 01110111 00100000 01100110 01101001 01101110 01100001 01101110 01100011 01101001 01100001 01101100 00100000 01110000 01110010 01101001 01101101 01101001 01110100 01101001 01110110 01100101 01110011 00101100 00100000 01100001 01101110 01100100 00100000 01101110 01100101 01110111 00100000 01101001 01101110 01110100 01100101 01110010 01101111 01110000 01100101 01110010 01100001 01100010 01101100 01100101 00100000 01100010 01101100 01101111 01100011 01101011 01100011 01101000 01100001 01101001 01101110 01110011 00101110"
        const binBuf:Buffer = bintools.fromBNToBuffer(new BN(bin));
        const binPayload:BINPayload = new BINPayload(binBuf);
        const binpBuf:Buffer = binPayload.toBuffer();

        expect(binPayload.typeID()).toBe(0);
        expect(binPayload.typeName()).toBe("BIN");
        expect(payloadTypes.select(0, binBuf)).toEqual(binPayload)

        let bincopy:BINPayload = new BINPayload();
        bincopy.fromBuffer(binpBuf)
        expect(bincopy.toBuffer().toString()).toBe(binPayload.toBuffer().toString());

        const returnType:Buffer = binPayload.returnType();
        expect(returnType).toEqual(binBuf);
    });

    test("UTF8Payload", () => {
        const utf8: string = "₠ ₡ ₢ ₣ ₤ ₥ ₦ ₧ ₨ ₩ ₪ ₫ € ₭ ₮ ₯ ₰ ₱ ₲ ₳ ₴ ₵ ₶ ₷ ₸ ₹ ₺ ₻ ₼ ₽ ₾ ₿"
        const utf8Payload:UTF8Payload = new UTF8Payload(utf8);
        const utf8pbuf:Buffer = utf8Payload.toBuffer();

        expect(utf8Payload.typeID()).toBe(1);
        expect(utf8Payload.typeName()).toBe("UTF8");
        expect(payloadTypes.select(1, utf8)).toEqual(utf8Payload)

        let utf8pcopy:UTF8Payload = new UTF8Payload();
        utf8pcopy.fromBuffer(utf8pbuf);
        expect(utf8pcopy.toBuffer().toString()).toBe(utf8Payload.toBuffer().toString());

        const returnType:string = utf8Payload.returnType();
        expect(returnType).toEqual(utf8);
    });

    test("HEXSTRPayload", () => {
        const hex:string = "4176616c616e63686520697320616e206f70656e2d736f7572636520706c6174666f726d20666f72206c61756e6368696e6720686967686c7920646563656e7472616c697a6564206170706c69636174696f6e732c206e65772066696e616e6369616c207072696d6974697665732c20616e64206e657720696e7465726f70657261626c6520626c6f636b636861696e732e";
        const hexPayload:HEXSTRPayload = new HEXSTRPayload(hex);
        const hexBuf:Buffer = hexPayload.toBuffer();

        expect(hexPayload.typeID()).toBe(2);
        expect(hexPayload.typeName()).toBe("HEXSTR");
        expect(payloadTypes.select(2, hex)).toEqual(hexPayload)

        let hexpcopy:HEXSTRPayload = new HEXSTRPayload();
        hexpcopy.fromBuffer(hexBuf);
        expect(hexpcopy.toBuffer().toString()).toBe(hexPayload.toBuffer().toString());

        const returnType:string = hexPayload.returnType();
        expect(returnType).toEqual(hex);
    });

    test("B58STRPayload", () => {
        const buf:Buffer = bintools.stringToBuffer("Avalanche is an open-source platform for launching highly decentralized applications, new financial primitives, and new interoperable blockchains.")
        const b58Str:string = bintools.cb58Encode(buf);
        const b58Payload:B58STRPayload = new B58STRPayload(b58Str);
        const b58Buf:Buffer = b58Payload.toBuffer();

        expect(b58Payload.typeID()).toBe(3);
        expect(b58Payload.typeName()).toBe("B58STR");
        expect(payloadTypes.select(3, b58Str)).toEqual(b58Payload)

        let b58copy:B58STRPayload = new B58STRPayload();
        b58copy.fromBuffer(b58Buf);
        expect(b58copy.toBuffer().toString()).toBe(b58Payload.toBuffer().toString());

        const returnType:string = b58Payload.returnType();
        expect(returnType).toEqual(b58Str);
    });

    test("B64STRPayload", () => {
        const buf:Buffer = bintools.stringToBuffer("Avalanche is an open-source platform for launching highly decentralized applications, new financial primitives, and new interoperable blockchains.")
        const b64Str:string = Buffer.from(bintools.cb58Encode(buf)).toString('base64');
        const b64STRPayload:B64STRPayload = new B64STRPayload(b64Str);
        const b64Buf:Buffer = b64STRPayload.toBuffer();

        expect(b64STRPayload.typeID()).toBe(4);
        expect(b64STRPayload.typeName()).toBe("B64STR");
        expect(payloadTypes.select(4, b64Str)).toEqual(b64STRPayload)

        let b64copy:B64STRPayload = new B64STRPayload();
        b64copy.fromBuffer(b64Buf);
        expect(b64copy.toBuffer().toString()).toBe(b64STRPayload.toBuffer().toString());

        const returnType:string = b64STRPayload.returnType();
        expect(returnType).toEqual(b64Str);
    });

    test("BIGNUMPayload", () => {
        const bn:BN = new BN(31415);
        const bnb:Buffer = bintools.fromBNToBuffer(bn);
        const bignumPayload:BIGNUMPayload = new BIGNUMPayload(bnb);
        const bnBuf:Buffer = bignumPayload.toBuffer();

        expect(bignumPayload.typeID()).toBe(5);
        expect(bignumPayload.typeName()).toBe("BIGNUM");
        expect(payloadTypes.select(5, bnb)).toEqual(bignumPayload)

        let bncopy:BIGNUMPayload = new BIGNUMPayload();
        bncopy.fromBuffer(bnBuf);
        expect(bncopy.toBuffer().toString()).toBe(bignumPayload.toBuffer().toString());

        const returnType:BN = bignumPayload.returnType();
        expect(returnType.toNumber()).toBe(bn.toNumber());
        expect(returnType.toString()).toBe(bn.toString());
        // expect(payloadTypes.select(10).toBuffer().toString()).toBe(assetidcopy.toBuffer().toString());
        // let assetid:ASSETIDPayload = new ASSETIDPayload(serialized);

        // expect(assetid.typeID()).toBe(10);
        // expect(assetid.typeName()).toBe("ASSETID");

        // let assetidcopy:ASSETIDPayload = new ASSETIDPayload();
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
