import BN from "bn.js";
import {Buffer} from "buffer/";
import BinTools from 'src/utils/bintools';
import { Output, OutTakeOrLeave, OutPayment, SelectOutputClass, OutCreateAsset } from 'src/apis/avm/outputs';

const bintools = BinTools.getInstance();

describe('Outputs', () => {
    let assetID:string = "8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533";
    let assetIDBuff:Buffer = Buffer.from(assetID, "hex");
    let addrs:Array<string> = [
        "B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW",
        "P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF",
        "6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV"
    ].sort();

    let locktime:BN = new BN(54321);
    let addrpay = [addrs[0], addrs[1]];
    let addrfall = [addrs[1], addrs[2]];
    let fallLocktime:BN = locktime.add(new BN(50));

    test('SelectOutputClass', () => {
        let outpayment:Output = SelectOutputClass(Buffer.from("00000000", "hex"));
        let outtol:Output = SelectOutputClass(Buffer.from("00000001", "hex"));
        let outputcreate:Output = SelectOutputClass(Buffer.from("00000002", "hex"));
        expect(outpayment).toBeInstanceOf(OutPayment);
        expect(outpayment).not.toBeInstanceOf(OutTakeOrLeave);
        expect(outpayment).not.toBeInstanceOf(OutCreateAsset);
        expect(outtol).toBeInstanceOf(OutTakeOrLeave);
        expect(outtol).not.toBeInstanceOf(OutCreateAsset);
        expect(outputcreate).toBeInstanceOf(OutCreateAsset);
        expect(outputcreate).not.toBeInstanceOf(OutPayment);
        expect(outputcreate).not.toBeInstanceOf(OutTakeOrLeave);
        expect(() => {
            SelectOutputClass(Buffer.from("00000099", "hex"));
        }).toThrow("Error - SelectOutputClass: unknown outputid");
    });

    test('comparitor', () => {

        let outpayment:Output = new OutPayment(assetIDBuff, new BN(10000), addrs, locktime, 3);
        let outtol:Output = new OutTakeOrLeave(assetIDBuff, new BN(10000), addrpay, addrfall, locktime, fallLocktime, 2, 1);
        let cmp = Output.comparitor();
        expect(cmp(outpayment, outtol)).toBe(-1);
        expect(cmp(outtol, outpayment)).toBe(1);
        expect(cmp(outtol, outtol)).toBe(0);
    });
    test('OutPayment', () => {
        let out:OutPayment = new OutPayment(assetIDBuff, new BN(10000), addrs, locktime, 3);
        expect(out.getOutputType()).toBe(0);
        expect(JSON.stringify(Object.keys(out.getAddresses()).sort())).toBe(JSON.stringify(addrs.sort()));
        expect(out.getAddresses()[addrs[0]].toNumber()).toBe(locktime.toNumber());
        expect(out.getAddresses()[addrs[1]].toNumber()).toBe(locktime.toNumber());
        expect(out.getAddresses()[addrs[2]].toNumber()).toBe(locktime.toNumber());

        expect(out.getThreshold()).toBe(3);
        expect(out.getLocktime().toNumber()).toBe(locktime.toNumber());

        expect(out.getAssetID().toString("hex")).toBe(assetID);

        let r = out.getAddressIdx(addrs[2]);
        expect(out.getAddress(...r)).toBe(addrs[2]);
        expect(() => {
            out.getAddress(400, false)
        }).toThrow();

        expect(out.getAmount().toNumber()).toBe(10000);

        let b:Buffer = out.toBuffer();
        expect(out.toString()).toBe(bintools.bufferToB58(b));

        let s:Array<string> = out.getSpenders(addrs);
        expect(JSON.stringify(s.sort())).toBe(JSON.stringify(addrs.sort()));

        let m1:boolean = out.meetsThreshold([addrs[0]]);
        expect(m1).toBe(false);
        let m2:boolean = out.meetsThreshold(addrs, new BN(100));
        expect(m2).toBe(false);
        let m3:boolean = out.meetsThreshold(addrs);
        expect(m3).toBe(true);
        let m4:boolean = out.meetsThreshold(addrs, locktime.add(new BN(100)));
        expect(m4).toBe(true);
    });

    test('OutTakeOrLeave', () => {
        let out:OutTakeOrLeave = new OutTakeOrLeave(assetIDBuff, new BN(10000), addrpay, addrfall, locktime, fallLocktime, 2, 1);
        expect(out.getOutputType()).toBe(1);
        expect(JSON.stringify(Object.keys(out.getAddresses()).sort())).toBe(JSON.stringify(addrs.sort()));
        
        expect(out.getAddresses()[addrs[1]].toNumber()).toBe(locktime.toNumber());
        expect(out.getAddresses()[addrs[2]].toNumber()).toBe(fallLocktime.toNumber());
        expect(out.getAddresses()[addrs[0]].toNumber()).toBe(locktime.toNumber());

        expect(out.getThreshold()).toBe(2);
        expect(out.getLocktime().toNumber()).toBe(locktime.toNumber());

        expect(out.getFallThreshold()).toBe(1);
        expect(out.getFallLocktime().toNumber()).toBe(fallLocktime.toNumber());

        expect(out.getAssetID().toString("hex")).toBe(assetID);

        let r = out.getAddressIdx(addrs[2]);
        expect(out.getAddress(...r)).toBe(addrs[2]);
        expect(() => {
            out.getAddress(400, false)
        }).toThrow();

        expect(out.getAmount().toNumber()).toBe(10000);

        let b:Buffer = out.toBuffer();
        expect(out.toString()).toBe(bintools.bufferToB58(b));

        let s1:Array<string> = out.getSpenders(addrs);
        expect(JSON.stringify(s1.sort())).toBe(JSON.stringify(addrpay.sort()));

        let s2:Array<string> = out.getSpenders(addrfall);
        expect(JSON.stringify(s2.sort())).toBe(JSON.stringify([addrfall[0]]));

        let m1:boolean = out.meetsThreshold([addrs[0]]);
        expect(m1).toBe(false);
        let m2:boolean = out.meetsThreshold(addrs, new BN(100));
        expect(m2).toBe(false);
        let m3:boolean = out.meetsThreshold(addrs);
        expect(m3).toBe(true);
        let m4:boolean = out.meetsThreshold(addrs, locktime.add(new BN(100)));
        expect(m4).toBe(true);
        let m5:boolean = out.meetsThreshold(addrfall, locktime.add(new BN(60)));
        expect(m5).toBe(true);
    });

    test('OutCreateAsset', () => {
        let out:OutCreateAsset = new OutCreateAsset(new BN(10000), addrs, locktime, 3);
        expect(out.getOutputType()).toBe(2);
        expect(JSON.stringify(Object.keys(out.getAddresses()).sort())).toBe(JSON.stringify(addrs.sort()));
        expect(out.getAddresses()[addrs[0]].toNumber()).toBe(locktime.toNumber());
        expect(out.getAddresses()[addrs[1]].toNumber()).toBe(locktime.toNumber());
        expect(out.getAddresses()[addrs[2]].toNumber()).toBe(locktime.toNumber());

        expect(out.getThreshold()).toBe(3);
        expect(out.getLocktime().toNumber()).toBe(locktime.toNumber());

        expect(out.getAssetID().toString("hex")).toBe("00");

        let r = out.getAddressIdx(addrs[2]);
        expect(out.getAddress(...r)).toBe(addrs[2]);
        expect(() => {
            out.getAddress(400, false)
        }).toThrow();

        expect(out.getAmount().toNumber()).toBe(10000);

        let b:Buffer = out.toBuffer();
        expect(out.toString()).toBe(bintools.bufferToB58(b));

        let s:Array<string> = out.getSpenders(addrs);
        expect(JSON.stringify(s.sort())).toBe(JSON.stringify(addrs.sort()));

        let m1:boolean = out.meetsThreshold([addrs[0]]);
        expect(m1).toBe(false);
        let m2:boolean = out.meetsThreshold(addrs, new BN(100));
        expect(m2).toBe(false);
        let m3:boolean = out.meetsThreshold(addrs);
        expect(m3).toBe(true);
        let m4:boolean = out.meetsThreshold(addrs, locktime.add(new BN(100)));
        expect(m4).toBe(true);
    });
});