import { SigIdx, Signature, Address, UnixNow } from '@slopes/avm/types';
import {Buffer} from "buffer/";
import BinTools from '@slopes/utils/bintools';

let bintools:BinTools = BinTools.getInstance();

describe('UnixNow', () => {
    test('Does it return the right time?', () => {
        let now = Math.round((new Date()).getTime() / 1000);
        let unow = UnixNow();
        expect(now / 10).toBeCloseTo(unow.divn(10).toNumber(), -1);
    });
});

describe('Signature & NBytes', () => {
    let sig = new Signature(); 
    let sigpop:Array<number> = [];
    for(let i:number = 0; i < sig.getSize(); i++){
        sigpop[i] = i;
    }
    let sigbuff:Buffer = Buffer.from(sigpop);
    let size = sig.fromBuffer(sigbuff);
    expect(sig.getSize()).toBe(size);
    expect(size).toBe(sig.getSize());
    let sigbuff2:Buffer = sig.toBuffer();
    for(let i:number = 0; i < sigbuff.length; i++){
        expect(sigbuff2[i]).toBe(sigbuff[i]);
    }
    let sigbuffstr:string = bintools.bufferToB58(sigbuff);
    expect(sig.toString()).toBe(sigbuffstr);
    sig.fromString(sigbuffstr);
    expect(sig.toString()).toBe(sigbuffstr);
});

describe('SigIdx', () => {
    let sigidx:SigIdx = new SigIdx();
    expect(sigidx.getSize()).toBe(sigidx.toBuffer().length);
    sigidx.setSource("abcd");
    expect(sigidx.getSource()).toBe("abcd");
});

describe('Address', () => {
    let addr1 = new Address();
    let addr2 = new Address();
    let smaller:Array<number> = [0,1,2,3,4,5,6,7,8,9,9,8,7,6,5,4,3,2,1,0];
    let bigger:Array<number> = [0,1,2,3,4,5,6,7,8,9,9,8,7,6,5,4,3,2,1,1]
    let addr1bytes:Buffer = Buffer.from(smaller);
    let addr2bytes:Buffer = Buffer.from(bigger);
    addr1.fromBuffer(addr1bytes);
    addr2.fromBuffer(addr2bytes);
    expect(Address.comparitor()(addr1,addr2)).toBe(-1);
    expect(Address.comparitor()(addr2,addr1)).toBe(1);
    
    let addr2str:string = addr2.toString();
    
    addr2.fromBuffer(addr1bytes);
    expect(Address.comparitor()(addr1,addr2)).toBe(0);
    
    addr2.fromString(addr2str);
    expect(Address.comparitor()(addr1,addr2)).toBe(-1);
    let a1b:Buffer = addr1.toBuffer();
    let a1s:string = bintools.bufferToB58(a1b);
    addr2.fromString(a1s);
    expect(Address.comparitor()(addr1,addr2)).toBe(0);

    let badbuff:Buffer = bintools.copyFrom(addr1bytes);
    let badbuffout:Buffer = Buffer.concat([badbuff, Buffer.from([1,2])]);
    let badstr:string = bintools.bufferToB58(badbuffout);
    let badaddr:Address = new Address();

    expect(() => {
        badaddr.fromString(badstr)
    }).toThrow("Error - Address.fromString: invalid address");

    badbuffout = Buffer.concat([badbuff, Buffer.from([1,2,3,4])]);
    badstr = bintools.bufferToB58(badbuffout);
    expect(() => {
        badaddr.fromString(badstr)
    }).toThrow("Error - Address.fromString: invalid checksum on address");

});