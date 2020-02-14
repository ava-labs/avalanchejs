import BN from "bn.js";
import {Buffer} from "buffer/";
import BinTools from 'src/utils/bintools';
import { UnixNow } from 'src/apis/avm/types';
import { SecpUTXO, UTXOSet } from 'src/apis/avm/utxos';

const bintools = BinTools.getInstance();

describe('SecpUTXO', () => {
    let utxohex:string = "38d1b9f1138672da6fb6c35125539276a9acc2a668d63bea6ba3c795e2edb0f5000000013e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd3558000000040000000000004dd500000000000000000000000100000001a36fd0c2dbcab311731dde7ef1514bd26fcdc74d";
    let outputhex:string = "3e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd3558000000040000000000004dd500000000000000000000000100000001a36fd0c2dbcab311731dde7ef1514bd26fcdc74d"
    let outputidx:string = "00000001";
    let outtxid:string = "38d1b9f1138672da6fb6c35125539276a9acc2a668d63bea6ba3c795e2edb0f5";
    let outaid:string = "3e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd3558";
    let opaddr:string = "FuB6Lw2D62NuM8zpGLA4Avepq7eGsZRiG";
    let opamt:string = "4dd5"
    let oplocktime:string = "00";
    let utxobuff:Buffer = Buffer.from(utxohex, "hex");

    let otheraddr:string = "MaTvKGccbYzCxzBkJpb2zHW7E1WReZqB8";
    
    //Payment
    let OPUTXOstr:string = "U9rFgK5jjdXmV8k5tpqeXkimzrN3o9eCCcXesyhMBBZu9MQJCDTDo5Wn5psKvzJVMJpiMbdkfDXkp7sKZddfCZdxpuDmyNy7VFka19zMW4jcz6DRQvNfA2kvJYKk96zc7uizgp3i2FYWrB8mr1sPJ8oP9Th64GQ5yHd8";
    
    //implies fromString and fromBuffer
    test('Creation', () => {
        let u1:SecpUTXO = new SecpUTXO();
        u1.fromBuffer(utxobuff);
        let u1hex:string = u1.toBuffer().toString("hex");
        expect(u1hex).toBe(utxohex);
    });

    test('Empty Creation', () => {
        let u1:SecpUTXO = new SecpUTXO();
        expect(() => {
            u1.toBuffer();
        }).toThrow();
    });

    test('Creation of Type', () => {
        let op:SecpUTXO = new SecpUTXO();
        op.fromString(OPUTXOstr);
        expect(op.getOuputID()).toBe(4);
    });

    describe('Funtionality', () => {
        let u1:SecpUTXO = new SecpUTXO();
        u1.fromBuffer(utxobuff);
        let u1hex:string = u1.toBuffer().toString("hex"); 
        test('getAmount', () => {
            expect(u1.getAmount().toNumber()).toBe(19925);
        });
        test('getAssetID NonCA', () => {
            let assetid:Buffer = u1.getAssetID();
            expect(assetid.toString("hex", 0, assetid.length)).toBe(outaid);
        });
        test('getTxID', () => {
            let txid:Buffer = u1.getTxID();
            expect(txid.toString("hex", 0, txid.length)).toBe(outtxid);
        });
        test('getTxIdx', () => {
            let txidx:Buffer = u1.getTxIdx();
            expect(txidx.toString("hex", 0, txidx.length)).toBe(outputidx);
        });
        test('getUTXOID', () => {
            let txid:Buffer = Buffer.from(outtxid, "hex");
            let txidx:Buffer = Buffer.from(outputidx, "hex");
            let utxoid:string = bintools.bufferToB58(Buffer.concat([txid, txidx]))
            expect(u1.getUTXOID()).toBe(utxoid);
        });
        test('toString', () => {
            let serialized:string = u1.toString();
            expect(serialized).toBe(bintools.avaSerialize(utxobuff));
        });

        test('getAddresses', () => {
            let addresses:Array<Buffer> = u1.getAddresses();
            for( let i = 0; i < addresses.length; i++ ){
                expect(addresses[i]).not.toBeUndefined();
            }
        });
        test('getAddressIdx', () => {
            let addropinfo:number = u1.getAddressIdx(bintools.avaDeserialize(opaddr));
            expect(addropinfo).toBe(0);
        });

        test('getAddress', () => {
            let recaddr1 = u1.getAddress(0);
            expect(recaddr1.toString("hex")).toBe(bintools.avaDeserialize(opaddr).toString("hex"));
        });

        test('getSpenders', () => {
            let addrs = [bintools.avaDeserialize(opaddr)];

            let thepast = u1.getSpenders(addrs, new BN(0));
            expect(thepast.length).toBe(0);

            let thefuture = u1.getSpenders(addrs, new BN(1));
            expect(thefuture.length).toBe(1);

        });

        test('meetsThreshold', () => {
            let addrs = [bintools.avaDeserialize(opaddr)];
            let thepast = u1.meetsThreshold(addrs, new BN(1));
            expect(thepast).toBe(true);

        });

    });
});

let setMergeTester = (input:UTXOSet, equal:Array<UTXOSet>, notEqual:Array<UTXOSet>):boolean => {
    let instr:string = JSON.stringify(input.getUTXOIDs().sort());
    for(let i:number = 0; i < equal.length; i++){
        if(JSON.stringify(equal[i].getUTXOIDs().sort()) != instr){
            console.log("equal failed: ", input.getUTXOIDs().sort(), i, equal[i].getUTXOIDs().sort());
            return false;
        }
    }

    for(let i:number = 0; i < notEqual.length; i++){
        if(JSON.stringify(notEqual[i].getUTXOIDs().sort()) == instr){
            console.log("notEqual failed: ", input.getUTXOIDs().sort(), i, notEqual[i].getUTXOIDs().sort());
            return false;
        }
    }
    return true;
}

describe('UTXOSet', () => {
    let utxostrs:Array<string> = [
        "8snom9a21FvVHqyasGGAZKSDjQXJg7CvTvA53is6uyhBxvGbc5WVACRoyscZZ1TGpqiGHTbmMBfMq6qE8fqTBFQTsMGJhQw68T1A9WBcazbMvGv6s6DtKV66sKPXLemTK6miMYWvjcvRCH6rihj7vpDa3Ffp2Jq2QZtJ",
        "U9rFgK5jjdXmV8k5tpqeXkimzrN3o9eCCcXesyhMBBZu9MQJCDTDo5Wn5psKvzJVMJpiMbdkfDXkp7sKZddfCZdxpuDmyNy7VFka19zMW4jcz6DRQvNfA2kvJYKk96zc7uizgp3i2FYWrB8mr1sPJ8oP9Th64GQ5yHd8",
        "adUbkxszkX9FbvnyKu6UA4g7XhAmPVj6PgPhLS6dTtUfCCr7oDEEXNYqWD2q5MuKPGgEhX16V451kAEUyYhiFMPYCjsAiCM1oWKnLmeA9joFr9jDYD5AoLAsVEyM13FZPf8vuKmF6JTZdCbMCgzHYrMjnb9i3iDPN4Qg"
    ];
    let addrs:Array<Buffer> = [
        bintools.avaDeserialize("FuB6Lw2D62NuM8zpGLA4Avepq7eGsZRiG"),
        bintools.avaDeserialize("MaTvKGccbYzCxzBkJpb2zHW7E1WReZqB8")
    ];
    test('Creation', () => {
        let set:UTXOSet = new UTXOSet();
        set.add(utxostrs[0]);
        let utxo:SecpUTXO = new SecpUTXO();
        utxo.fromString(utxostrs[0]);
        let setArray:Array<SecpUTXO> = set.getAllUTXOs();
        expect(utxo.toString()).toBe(setArray[0].toString());
    });

    test('Mutliple add', () => {
        let set:UTXOSet = new UTXOSet();
        //first add
        for(let i:number = 0; i < utxostrs.length; i++){
            set.add(utxostrs[i]);
        }
        //the verify (do these steps separate to ensure no overwrites)
        for(let i:number = 0; i < utxostrs.length; i++){
            expect(set.includes(utxostrs[i])).toBe(true);
            let utxo:SecpUTXO = new SecpUTXO();
            utxo.fromString(utxostrs[i]);
            let veriutxo:SecpUTXO = set.getUTXO(utxo.getUTXOID()) as SecpUTXO;
            expect(veriutxo.toString()).toBe(utxostrs[i]);
        }

    });

    test('addArray', () => {
        let set:UTXOSet = new UTXOSet();
        set.addArray(utxostrs);
        for(let i:number = 0; i < utxostrs.length; i++){
            let e1:SecpUTXO = new SecpUTXO();
            e1.fromString(utxostrs[i]);
            expect(set.includes(e1)).toBe(true);
            let utxo:SecpUTXO = new SecpUTXO();
            utxo.fromString(utxostrs[i]);
            let veriutxo:SecpUTXO = set.getUTXO(utxo.getUTXOID()) as SecpUTXO;
            expect(veriutxo.toString()).toBe(utxostrs[i]);
        }

        set.addArray(set.getAllUTXOs());
        for(let i:number = 0; i < utxostrs.length; i++){
            let utxo:SecpUTXO = new SecpUTXO();
            utxo.fromString(utxostrs[i]);
            expect(set.includes(utxo)).toBe(true);

            let veriutxo:SecpUTXO = set.getUTXO(utxo.getUTXOID()) as SecpUTXO;
            expect(veriutxo.toString()).toBe(utxostrs[i]);
        }
    });

    test('overwriting SecpUTXOs', () => {
        let set:UTXOSet = new UTXOSet();
        set.addArray(utxostrs);
        expect(set.add(utxostrs[0], true)).toBe(true);
        expect(set.add(utxostrs[0], false)).toBe(false);
        expect(set.addArray(utxostrs, true).length).toBe(3);
        expect(set.addArray(utxostrs, false).length).toBe(0);
    });

    describe('Functionality', () => {
        let set:UTXOSet;
        let utxos:Array<SecpUTXO>;
        beforeEach(() => {
            set = new UTXOSet();
            set.addArray(utxostrs);
            utxos = set.getAllUTXOs();
        });
        
        test('remove', () => {
            expect(set.remove(utxostrs[0])).toBe(true);
            expect(set.remove(utxostrs[0])).toBe(false);
            expect(set.add(utxostrs[0], false)).toBe(true);
            expect(set.remove(utxostrs[0])).toBe(true);
        });

        test('removeArray', () => {
            expect(set.removeArray(utxostrs).length).toBe(3);
            expect(set.removeArray(utxostrs).length).toBe(0);
            expect(set.add(utxostrs[0], false)).toBe(true);
            expect(set.removeArray(utxostrs).length).toBe(1);
            expect(set.addArray(utxostrs, false).length).toBe(3);
            expect(set.removeArray(utxos).length).toBe(3);
        });

        test('getUTXOIDs', () => {
            let uids:Array<string> = set.getUTXOIDs();
            for(let i:number = 0; i < utxos.length; i++){
                expect(uids.indexOf(utxos[i].getUTXOID())).not.toBe(-1);
            }
        });

        test('getAllUTXOs', () => {
            let allutxos:Array<SecpUTXO> = set.getAllUTXOs();
            let ustrs:Array<string> = [];
            for(let i:number = 0; i < allutxos.length; i++){
                ustrs.push(allutxos[i].toString());
            }
            for(let i:number = 0; i < utxostrs.length; i++) {
                expect(ustrs.indexOf(utxostrs[i])).not.toBe(-1);
            }
            let uids:Array<string> = set.getUTXOIDs();
            let allutxos2:Array<SecpUTXO> = set.getAllUTXOs(uids);
            let ustrs2:Array<string> = [];
            for(let i:number = 0; i < allutxos.length; i++){
                ustrs2.push(allutxos2[i].toString());
            }
            for(let i:number = 0; i < utxostrs.length; i++) {
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
            let ustrs:Array<string> = set.getAllUTXOStrings();
            for(let i:number = 0; i < utxostrs.length; i++) {
                expect(ustrs.indexOf(utxostrs[i])).not.toBe(-1);
            }
            let uids:Array<string> = set.getUTXOIDs();
            let ustrs2:Array<string> = set.getAllUTXOStrings(uids);
            for(let i:number = 0; i < utxostrs.length; i++) {
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
            for(let i:number = 0; i < utxos.length; i++){
                let assetid = utxos[i].getAssetID();
                balance1.add(set.getBalance(addrs, assetid));
                balance2.add(utxos[i].getAmount());
            }
            expect(balance1.toString()).toBe(balance2.toString());

            balance1 = new BN(0);
            balance2 = new BN(0);
            let now:BN = UnixNow();
            for(let i:number = 0; i < utxos.length; i++){
                let assetid = bintools.avaSerialize(utxos[i].getAssetID());
                balance1.add(set.getBalance(addrs, assetid, now));
                balance2.add(utxos[i].getAmount());
            }
            expect(balance1.toString()).toBe(balance2.toString());
        });

        test('getAssetIDs', () => {
            let assetIDs:Array<Buffer> = set.getAssetIDs();
            for(let i:number = 0; i < utxos.length; i++){
                expect(assetIDs).toContain(utxos[i].getAssetID())
            }
            let addresses:Array<Buffer> = set.getAddresses();
            expect(set.getAssetIDs(addresses)).toEqual(set.getAssetIDs())
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
            //Take-or-Leave
            let newutxo:string = "QyaDeF2yYxzQuatMEgijoYerFBVTwomhaTGraUrCngZomXtxPT2AHaKPVGh8rwtTGKMEYS1YN3CmdZitZKL9ENHRY99uNdQHogV36v8iFCjMsD7Ygm8WWY3xVu19VzJj1anktNPL8xNEN538PFcBv5eTz87jQCsWj4i7";
            
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
                setE.addArray([]);//empty set

                setF = new UTXOSet();
                setF.addArray(utxostrs); //full set, separate from self

                setG = new UTXOSet();
                setG.addArray([newutxo, ...utxostrs]); //full set with new element

                setH = new UTXOSet();
                setH.addArray([newutxo]); //set with only a new element
            });

            test('unknown merge rule',  () => {
                expect(() => {
                    set.mergeByRule(setA, "ERROR");
                }).toThrow();
                let setArray:Array<SecpUTXO> = setG.getAllUTXOs();      
            });

            test('intersection', () => {
                let results:UTXOSet;
                let test:boolean;

                results = set.mergeByRule(setA, "intersection");
                test = setMergeTester(results, [setA], [setB, setC, setD, setE, setF, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setF, "intersection");
                test = setMergeTester(results, [setF], [setA, setB, setC, setD, setE, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setG, "intersection");
                test = setMergeTester(results, [setF], [setA, setB, setC, setD, setE, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setH, "intersection");
                test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
                expect(test).toBe(true);
            });

            test('differenceSelf', () => {
                let results:UTXOSet;
                let test:boolean;

                results = set.mergeByRule(setA, "differenceSelf");
                test = setMergeTester(results, [setD], [setA, setB, setC, setE, setF, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setF, "differenceSelf");
                test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setG, "differenceSelf");
                test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setH, "differenceSelf");
                test = setMergeTester(results, [setF], [setA, setB, setC, setD, setE, setG, setH]);
                expect(test).toBe(true);
            });

            test('differenceNew', () => {
                let results:UTXOSet;
                let test:boolean;

                results = set.mergeByRule(setA, "differenceNew");
                test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setF, "differenceNew");
                test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setG, "differenceNew");
                test = setMergeTester(results, [setH], [setA, setB, setC, setD, setE, setF, setG]);
                expect(test).toBe(true);

                results = set.mergeByRule(setH, "differenceNew");
                test = setMergeTester(results, [setH], [setA, setB, setC, setD, setE, setF, setG]);
                expect(test).toBe(true);
            });

            test('symDifference', () => {
                let results:UTXOSet;
                let test:boolean;

                results = set.mergeByRule(setA, "symDifference");
                test = setMergeTester(results, [setD], [setA, setB, setC, setE, setF, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setF, "symDifference");
                test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setG, "symDifference");
                test = setMergeTester(results, [setH], [setA, setB, setC, setD, setE, setF, setG]);
                expect(test).toBe(true);

                results = set.mergeByRule(setH, "symDifference");
                test = setMergeTester(results, [setG], [setA, setB, setC, setD, setE, setF, setH]);
                expect(test).toBe(true);
            });

            test('union', () => {
                let results:UTXOSet;
                let test:boolean;

                results = set.mergeByRule(setA, "union");
                test = setMergeTester(results, [setF], [setA, setB, setC, setD, setE, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setF, "union");
                test = setMergeTester(results, [setF], [setA, setB, setC, setD, setE, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setG, "union");
                test = setMergeTester(results, [setG], [setA, setB, setC, setD, setE, setF, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setH, "union");
                test = setMergeTester(results, [setG], [setA, setB, setC, setD, setE, setF, setH]);
                expect(test).toBe(true);
            });

            test('unionMinusNew', () => {
                let results:UTXOSet;
                let test:boolean;

                results = set.mergeByRule(setA, "unionMinusNew");
                test = setMergeTester(results, [setD], [setA, setB, setC, setE, setF, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setF, "unionMinusNew");
                test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setG, "unionMinusNew");
                test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setH, "unionMinusNew");
                test = setMergeTester(results, [setF], [setA, setB, setC, setD, setE, setG, setH]);
                expect(test).toBe(true);
            });

            test('unionMinusSelf', () => {
                let results:UTXOSet;
                let test:boolean;

                results = set.mergeByRule(setA, "unionMinusSelf");
                test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setF, "unionMinusSelf");
                test = setMergeTester(results, [setE], [setA, setB, setC, setD, setF, setG, setH]);
                expect(test).toBe(true);

                results = set.mergeByRule(setG, "unionMinusSelf");
                test = setMergeTester(results, [setH], [setA, setB, setC, setD, setE, setF, setG]);
                expect(test).toBe(true);

                results = set.mergeByRule(setH, "unionMinusSelf");
                test = setMergeTester(results, [setH], [setA, setB, setC, setD, setE, setF, setG]);
                expect(test).toBe(true);
            });
        });


    });
});

