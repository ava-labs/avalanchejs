import BN from 'bn.js';
import { Buffer } from 'buffer/';
import BinTools from 'src/utils/bintools';
import { UTXO, UTXOSet } from 'src/apis/platformvm/utxos';
import { AmountOutput } from 'src/apis/platformvm/outputs';
import { UnixNow } from 'src/utils/helperfunctions';

const bintools = BinTools.getInstance();

describe('UTXO', () => {
  const utxohex:string = '000038d1b9f1138672da6fb6c35125539276a9acc2a668d63bea6ba3c795e2edb0f5000000013e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd3558000000070000000000004dd500000000000000000000000100000001a36fd0c2dbcab311731dde7ef1514bd26fcdc74d';
  const outputhex:string = '3e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd3558000000070000000000004dd500000000000000000000000100000001a36fd0c2dbcab311731dde7ef1514bd26fcdc74d';
  const outputidx:string = '00000001';
  const outtxid:string = '38d1b9f1138672da6fb6c35125539276a9acc2a668d63bea6ba3c795e2edb0f5';
  const outaid:string = '3e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd3558';
  const opaddr:string = 'FuB6Lw2D62NuM8zpGLA4Avepq7eGsZRiG';
  const opamt:string = '4dd5';
  const oplocktime:string = '00';
  const utxobuff:Buffer = Buffer.from(utxohex, 'hex');

  const otheraddr:string = 'MaTvKGccbYzCxzBkJpb2zHW7E1WReZqB8';

  // Payment
  const OPUTXOstr:string = bintools.cb58Encode(utxobuff);
  // "U9rFgK5jjdXmV8k5tpqeXkimzrN3o9eCCcXesyhMBBZu9MQJCDTDo5Wn5psKvzJVMJpiMbdkfDXkp7sKZddfCZdxpuDmyNy7VFka19zMW4jcz6DRQvNfA2kvJYKk96zc7uizgp3i2FYWrB8mr1sPJ8oP9Th64GQ5yHd8";

  // implies fromString and fromBuffer
  test('Creation', () => {
    const u1:UTXO = new UTXO();
    u1.fromBuffer(utxobuff);
    const u1hex:string = u1.toBuffer().toString('hex');
    expect(u1hex).toBe(utxohex);
  });

  test('Empty Creation', () => {
    const u1:UTXO = new UTXO();
    expect(() => {
      u1.toBuffer();
    }).toThrow();
  });

  test('Creation of Type', () => {
    const op:UTXO = new UTXO();
    op.fromString(OPUTXOstr);
    expect(op.getOutput().getOutputID()).toBe(7);
  });

  describe('Funtionality', () => {
    const u1:UTXO = new UTXO();
    u1.fromBuffer(utxobuff);
    const u1hex:string = u1.toBuffer().toString('hex');
    test('getAssetID NonCA', () => {
      const assetid:Buffer = u1.getAssetID();
      expect(assetid.toString('hex', 0, assetid.length)).toBe(outaid);
    });
    test('getTxID', () => {
      const txid:Buffer = u1.getTxID();
      expect(txid.toString('hex', 0, txid.length)).toBe(outtxid);
    });
    test('getOutputIdx', () => {
      const txidx:Buffer = u1.getOutputIdx();
      expect(txidx.toString('hex', 0, txidx.length)).toBe(outputidx);
    });
    test('getUTXOID', () => {
      const txid:Buffer = Buffer.from(outtxid, 'hex');
      const txidx:Buffer = Buffer.from(outputidx, 'hex');
      const utxoid:string = bintools.bufferToB58(Buffer.concat([txid, txidx]));
      expect(u1.getUTXOID()).toBe(utxoid);
    });
    test('toString', () => {
      const serialized:string = u1.toString();
      expect(serialized).toBe(bintools.cb58Encode(utxobuff));
    });
  });
});

const setMergeTester = (input:UTXOSet, equal:Array<UTXOSet>, notEqual:Array<UTXOSet>):boolean => {
  const instr:string = JSON.stringify(input.getUTXOIDs().sort());
  for (let i:number = 0; i < equal.length; i++) {
    if (JSON.stringify(equal[i].getUTXOIDs().sort()) != instr) {
      return false;
    }
  }

  for (let i:number = 0; i < notEqual.length; i++) {
    if (JSON.stringify(notEqual[i].getUTXOIDs().sort()) == instr) {
      return false;
    }
  }
  return true;
};

describe('UTXOSet', () => {
  const utxostrs:Array<string> = [
    bintools.cb58Encode(Buffer.from('000038d1b9f1138672da6fb6c35125539276a9acc2a668d63bea6ba3c795e2edb0f5000000013e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd3558000000070000000000004dd500000000000000000000000100000001a36fd0c2dbcab311731dde7ef1514bd26fcdc74d', 'hex')),
    bintools.cb58Encode(Buffer.from('0000c3e4823571587fe2bdfc502689f5a8238b9d0ea7f3277124d16af9de0d2d9911000000003e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd355800000007000000000000001900000000000000000000000100000001e1b6b6a4bad94d2e3f20730379b9bcd6f176318e', 'hex')),
    bintools.cb58Encode(Buffer.from('0000f29dba61fda8d57a911e7f8810f935bde810d3f8d495404685bdb8d9d8545e86000000003e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd355800000007000000000000001900000000000000000000000100000001e1b6b6a4bad94d2e3f20730379b9bcd6f176318e', 'hex')),
  ];
  const addrs:Array<Buffer> = [
    bintools.cb58Decode('FuB6Lw2D62NuM8zpGLA4Avepq7eGsZRiG'),
    bintools.cb58Decode('MaTvKGccbYzCxzBkJpb2zHW7E1WReZqB8'),
  ];
  test('Creation', () => {
    const set:UTXOSet = new UTXOSet();
    set.add(utxostrs[0]);
    const utxo:UTXO = new UTXO();
    utxo.fromString(utxostrs[0]);
    const setArray:Array<UTXO> = set.getAllUTXOs();
    expect(utxo.toString()).toBe(setArray[0].toString());

  });

  test('Serialization', () => {
    const set:UTXOSet = new UTXOSet();
    set.addArray([...utxostrs]);
    let setobj:object = set.serialize("cb58");
    let setstr:string = JSON.stringify(setobj);
    /*
    console.log("-----SET1 JSON-----");
    console.log(setstr);
    console.log("-----SET1 ENDN-----");
    */
    let set2newobj:object = JSON.parse(setstr);
    let set2:UTXOSet = new UTXOSet();
    set2.deserialize(set2newobj, "cb58");
    let set2obj:object = set2.serialize("cb58");
    let set2str:string = JSON.stringify(set2obj);
    /*
    console.log("-----SET2 JSON-----");
    console.log(set2str);
    console.log("-----SET2 ENDN-----");
    */

    expect(set2.getAllUTXOStrings().sort().join(',')).toBe(set.getAllUTXOStrings().sort().join(','));
  });

  test('Mutliple add', () => {
    const set:UTXOSet = new UTXOSet();
    // first add
    for (let i:number = 0; i < utxostrs.length; i++) {
      set.add(utxostrs[i]);
    }
    // the verify (do these steps separate to ensure no overwrites)
    for (let i:number = 0; i < utxostrs.length; i++) {
      expect(set.includes(utxostrs[i])).toBe(true);
      const utxo:UTXO = new UTXO();
      utxo.fromString(utxostrs[i]);
      const veriutxo:UTXO = set.getUTXO(utxo.getUTXOID()) as UTXO;
      expect(veriutxo.toString()).toBe(utxostrs[i]);
    }
  });

  test('addArray', () => {
    const set:UTXOSet = new UTXOSet();
    set.addArray(utxostrs);
    for (let i:number = 0; i < utxostrs.length; i++) {
      const e1:UTXO = new UTXO();
      e1.fromString(utxostrs[i]);
      expect(set.includes(e1)).toBe(true);
      const utxo:UTXO = new UTXO();
      utxo.fromString(utxostrs[i]);
      const veriutxo:UTXO = set.getUTXO(utxo.getUTXOID()) as UTXO;
      expect(veriutxo.toString()).toBe(utxostrs[i]);
    }

    set.addArray(set.getAllUTXOs());
    for (let i:number = 0; i < utxostrs.length; i++) {
      const utxo:UTXO = new UTXO();
      utxo.fromString(utxostrs[i]);
      expect(set.includes(utxo)).toBe(true);

      const veriutxo:UTXO = set.getUTXO(utxo.getUTXOID()) as UTXO;
      expect(veriutxo.toString()).toBe(utxostrs[i]);
    }
    let o:object = set.serialize("hex");
    let s:UTXOSet = new UTXOSet();
    s.deserialize(o);
    let t:object = set.serialize("display");
    let r:UTXOSet = new UTXOSet();
    r.deserialize(t);
  });

  test('overwriting UTXO', () => {
    const set:UTXOSet = new UTXOSet();
    set.addArray(utxostrs);
    const testutxo:UTXO = new UTXO();
    testutxo.fromString(utxostrs[0]);
    expect(set.add(utxostrs[0], true).toString()).toBe(testutxo.toString());
    expect(set.add(utxostrs[0], false)).toBeUndefined();
    expect(set.addArray(utxostrs, true).length).toBe(3);
    expect(set.addArray(utxostrs, false).length).toBe(0);
  });

  describe('Functionality', () => {
    let set:UTXOSet;
    let utxos:Array<UTXO>;
    beforeEach(() => {
      set = new UTXOSet();
      set.addArray(utxostrs);
      utxos = set.getAllUTXOs();
    });

    test('remove', () => {
      const testutxo:UTXO = new UTXO();
      testutxo.fromString(utxostrs[0]);
      expect(set.remove(utxostrs[0]).toString()).toBe(testutxo.toString());
      expect(set.remove(utxostrs[0])).toBeUndefined();
      expect(set.add(utxostrs[0], false).toString()).toBe(testutxo.toString());
      expect(set.remove(utxostrs[0]).toString()).toBe(testutxo.toString());
    });

    test('removeArray', () => {
      const testutxo:UTXO = new UTXO();
      testutxo.fromString(utxostrs[0]);
      expect(set.removeArray(utxostrs).length).toBe(3);
      expect(set.removeArray(utxostrs).length).toBe(0);
      expect(set.add(utxostrs[0], false).toString()).toBe(testutxo.toString());
      expect(set.removeArray(utxostrs).length).toBe(1);
      expect(set.addArray(utxostrs, false).length).toBe(3);
      expect(set.removeArray(utxos).length).toBe(3);
    });

    test('getUTXOIDs', () => {
      const uids:Array<string> = set.getUTXOIDs();
      for (let i:number = 0; i < utxos.length; i++) {
        expect(uids.indexOf(utxos[i].getUTXOID())).not.toBe(-1);
      }
    });

    test('getAllUTXOs', () => {
      const allutxos:Array<UTXO> = set.getAllUTXOs();
      const ustrs:Array<string> = [];
      for (let i:number = 0; i < allutxos.length; i++) {
        ustrs.push(allutxos[i].toString());
      }
      for (let i:number = 0; i < utxostrs.length; i++) {
        expect(ustrs.indexOf(utxostrs[i])).not.toBe(-1);
      }
      const uids:Array<string> = set.getUTXOIDs();
      const allutxos2:Array<UTXO> = set.getAllUTXOs(uids);
      const ustrs2:Array<string> = [];
      for (let i:number = 0; i < allutxos.length; i++) {
        ustrs2.push(allutxos2[i].toString());
      }
      for (let i:number = 0; i < utxostrs.length; i++) {
        expect(ustrs2.indexOf(utxostrs[i])).not.toBe(-1);
      }
    });

    test('getUTXOIDs By Address', () => {
      let utxoids:Array<string>;
      utxoids = set.getUTXOIDs([addrs[0]]);
      expect(utxoids.length).toBe(1);
      utxoids = set.getUTXOIDs(addrs);
      expect(utxoids.length).toBe(3);
      utxoids = set.getUTXOIDs(addrs, false);
      expect(utxoids.length).toBe(3);
    });

    test('getAllUTXOStrings', () => {
      const ustrs:Array<string> = set.getAllUTXOStrings();
      for (let i:number = 0; i < utxostrs.length; i++) {
        expect(ustrs.indexOf(utxostrs[i])).not.toBe(-1);
      }
      const uids:Array<string> = set.getUTXOIDs();
      const ustrs2:Array<string> = set.getAllUTXOStrings(uids);
      for (let i:number = 0; i < utxostrs.length; i++) {
        expect(ustrs2.indexOf(utxostrs[i])).not.toBe(-1);
      }
    });

    test('getAddresses', () => {
      expect(set.getAddresses().sort()).toStrictEqual(addrs.sort());
    });

    test('getBalance', () => {
      let balance1:BN;
      let balance2:BN;
      balance1 = new BN(0);
      balance2 = new BN(0);
      for (let i:number = 0; i < utxos.length; i++) {
        const assetid = utxos[i].getAssetID();
        balance1.add(set.getBalance(addrs, assetid));
        balance2.add((utxos[i].getOutput() as AmountOutput).getAmount());
      }
      expect(balance1.toString()).toBe(balance2.toString());

      balance1 = new BN(0);
      balance2 = new BN(0);
      const now:BN = UnixNow();
      for (let i:number = 0; i < utxos.length; i++) {
        const assetid = bintools.cb58Encode(utxos[i].getAssetID());
        balance1.add(set.getBalance(addrs, assetid, now));
        balance2.add((utxos[i].getOutput() as AmountOutput).getAmount());
      }
      expect(balance1.toString()).toBe(balance2.toString());
    });

    test('getAssetIDs', () => {
      const assetIDs:Array<Buffer> = set.getAssetIDs();
      for (let i:number = 0; i < utxos.length; i++) {
        expect(assetIDs).toContain(utxos[i].getAssetID());
      }
      const addresses:Array<Buffer> = set.getAddresses();
      expect(set.getAssetIDs(addresses)).toEqual(set.getAssetIDs());
    });

    describe('Merge Rules', () => {
      let setA:UTXOSet;
      let setB:UTXOSet;
      let setC:UTXOSet;
      let setD:UTXOSet;
      let setE:UTXOSet;
      let setF:UTXOSet;
      let setG:UTXOSet;
      let setH:UTXOSet;
      // Take-or-Leave
      const newutxo:string = bintools.cb58Encode(Buffer.from('0000acf88647b3fbaa9fdf4378f3a0df6a5d15d8efb018ad78f12690390e79e1687600000003acf88647b3fbaa9fdf4378f3a0df6a5d15d8efb018ad78f12690390e79e168760000000700000000000186a000000000000000000000000100000001fceda8f90fcb5d30614b99d79fc4baa293077626', 'hex'));

      beforeEach(() => {
        setA = new UTXOSet();
        setA.addArray([utxostrs[0], utxostrs[2]]);

        setB = new UTXOSet();
        setB.addArray([utxostrs[1], utxostrs[2]]);

        setC = new UTXOSet();
        setC.addArray([utxostrs[0], utxostrs[1]]);

        setD = new UTXOSet();
        setD.addArray([utxostrs[1]]);

        setE = new UTXOSet();
        setE.addArray([]);// empty set

        setF = new UTXOSet();
        setF.addArray(utxostrs); // full set, separate from self

        setG = new UTXOSet();
        setG.addArray([newutxo, ...utxostrs]); // full set with new element

        setH = new UTXOSet();
        setH.addArray([newutxo]); // set with only a new element
      });

      test('unknown merge rule', () => {
        expect(() => {
          set.mergeByRule(setA, 'ERROR');
        }).toThrow();
        const setArray:Array<UTXO> = setG.getAllUTXOs();
      });

      test('intersection', () => {
        let results:UTXOSet;
        let test:boolean;

        results = set.mergeByRule(setA, 'intersection');
        test = setMergeTester(results, [setA], [setB, setC, setD, setE, setF, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setF, 'intersection');
        test = setMergeTester(results, [setF], [setA, setB, setC, setD, setE, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setG, 'intersection');
        test = setMergeTester(results, [setF], [setA, setB, setC, setD, setE, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setH, 'intersection');
        test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
        expect(test).toBe(true);
      });

      test('differenceSelf', () => {
        let results:UTXOSet;
        let test:boolean;

        results = set.mergeByRule(setA, 'differenceSelf');
        test = setMergeTester(results, [setD], [setA, setB, setC, setE, setF, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setF, 'differenceSelf');
        test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setG, 'differenceSelf');
        test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setH, 'differenceSelf');
        test = setMergeTester(results, [setF], [setA, setB, setC, setD, setE, setG, setH]);
        expect(test).toBe(true);
      });

      test('differenceNew', () => {
        let results:UTXOSet;
        let test:boolean;

        results = set.mergeByRule(setA, 'differenceNew');
        test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setF, 'differenceNew');
        test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setG, 'differenceNew');
        test = setMergeTester(results, [setH], [setA, setB, setC, setD, setE, setF, setG]);
        expect(test).toBe(true);

        results = set.mergeByRule(setH, 'differenceNew');
        test = setMergeTester(results, [setH], [setA, setB, setC, setD, setE, setF, setG]);
        expect(test).toBe(true);
      });

      test('symDifference', () => {
        let results:UTXOSet;
        let test:boolean;

        results = set.mergeByRule(setA, 'symDifference');
        test = setMergeTester(results, [setD], [setA, setB, setC, setE, setF, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setF, 'symDifference');
        test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setG, 'symDifference');
        test = setMergeTester(results, [setH], [setA, setB, setC, setD, setE, setF, setG]);
        expect(test).toBe(true);

        results = set.mergeByRule(setH, 'symDifference');
        test = setMergeTester(results, [setG], [setA, setB, setC, setD, setE, setF, setH]);
        expect(test).toBe(true);
      });

      test('union', () => {
        let results:UTXOSet;
        let test:boolean;

        results = set.mergeByRule(setA, 'union');
        test = setMergeTester(results, [setF], [setA, setB, setC, setD, setE, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setF, 'union');
        test = setMergeTester(results, [setF], [setA, setB, setC, setD, setE, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setG, 'union');
        test = setMergeTester(results, [setG], [setA, setB, setC, setD, setE, setF, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setH, 'union');
        test = setMergeTester(results, [setG], [setA, setB, setC, setD, setE, setF, setH]);
        expect(test).toBe(true);
      });

      test('unionMinusNew', () => {
        let results:UTXOSet;
        let test:boolean;

        results = set.mergeByRule(setA, 'unionMinusNew');
        test = setMergeTester(results, [setD], [setA, setB, setC, setE, setF, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setF, 'unionMinusNew');
        test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setG, 'unionMinusNew');
        test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setH, 'unionMinusNew');
        test = setMergeTester(results, [setF], [setA, setB, setC, setD, setE, setG, setH]);
        expect(test).toBe(true);
      });

      test('unionMinusSelf', () => {
        let results:UTXOSet;
        let test:boolean;

        results = set.mergeByRule(setA, 'unionMinusSelf');
        test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setF, 'unionMinusSelf');
        test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
        expect(test).toBe(true);

        results = set.mergeByRule(setG, 'unionMinusSelf');
        test = setMergeTester(results, [setH], [setA, setB, setC, setD, setE, setF, setG]);
        expect(test).toBe(true);

        results = set.mergeByRule(setH, 'unionMinusSelf');
        test = setMergeTester(results, [setH], [setA, setB, setC, setD, setE, setF, setG]);
        expect(test).toBe(true);
      });
    });
  });
});
