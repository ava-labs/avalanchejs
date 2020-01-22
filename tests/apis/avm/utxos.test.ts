import BN from "bn.js";
import {Buffer} from "buffer/";
import BinTools from '../../../src/utils/bintools';
import { UnixNow } from '../../../src/apis/avm/types';
import { UTXO, UTXOSet } from '../../../src/apis/avm/utxos';

const bintools = BinTools.getInstance();

describe('UTXO', () => {
    let utxohex:string = "f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e700000001000000018a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d5330000000000003039000000000000d431000000010000000151025c61fbcfc078f69334f834be6dd26d55a955000000000000ddd50000000100000001c3344128e060128ede3523a24a461c8943ab0859";
    let outputhex:string = "000000018a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d5330000000000003039000000000000d431000000010000000151025c61fbcfc078f69334f834be6dd26d55a955000000000000ddd50000000100000001c3344128e060128ede3523a24a461c8943ab0859"
    let outputidx:string = "00000001";
    let txid:string = "f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7";
    let opaddr:string = "8PLZaKGNoxNDLJ3NRag8Ff1aWUzNe8Kja";
    let oplocktime:string = "d431";
    let toladdr:string = "Jo9N7gxKAVy3q58eDYzhXXwGf78xXAMYA";
    let tollocktime:string = "ddd5";
    let utxobuff:Buffer = Buffer.from(utxohex, "hex");

    //Payment
    let OPUTXOstr:string = "49N8kgxkXtuTG5tsTy7UccvKgJq9ZvyvXULbyCj2GRuc9Vrn5nv5K8t4NcA4omVjg8iYJ3HhZa3HSyizaWGr9X3XZhBTEweUvuxcaHzd3uGig2q6cESdW5rWqWs5mejSKMiqNBVEPMjfSUv3kvzKnnQPi4v7ejKaurNu";
    //Take-or-Leave
    let TOLUTXOstr:string = "2ACVKeLATDeZ9h3MkMbSS7uTfic51anX6GdmaUwBH3Q6poMBGxm4xv5qvaSfpRYATDoffXRVpdUwh2GWxuToTbn67HE42kPH91Lhs2cQqzY76ZXv23z73EUCkoBfmLFjB72SHcT2xsWXx55uv9iSrMjrb5gXhRMCRr2Q59qLEDGogoa1j4XzND82DwmSNcWqXqQCw8Mt6TAJRee2V8pGpC";
    //CreateAsset
    let CAUTXOstr:string = "Po53UiAo7yG816YnCjX6ymfxvCHVFyQaUGkVPvovFsg8Q6yUbqrDkwdTffgzH6H9LtqTqBABTgJFXrgRENyHYrkzdAmuCLjf2UuBzDxasSn3tD3UqHRVBzWWVGSHom6e2uffd2Q2xJRLuXAtbuRVAGiS1JofCWQkMh7pxXMAZUEeUfB";
    
    //implies fromString and fromBuffer
    test('Creation', () => {
        let u1:UTXO = new UTXO(bintools.avaSerialize(utxobuff));;
        let u1hex:string = u1.toBuffer().toString("hex");
        expect(u1hex).toBe(utxohex);
    });

    test('Empty Creation', () => {
        let u1:UTXO = new UTXO();
        expect(() => {
            u1.toBuffer();
        }).toThrow();
    });

    test('Creation of Type', () => {
        let op:UTXO = new UTXO(OPUTXOstr);
        expect(op.getOuputType()).toBe(0);
        let tol:UTXO = new UTXO(TOLUTXOstr);
        expect(tol.getOuputType()).toBe(1);
        let ca:UTXO = new UTXO(CAUTXOstr);
        expect(ca.getOuputType()).toBe(2);
    });

    describe('Funtionality', () => {
        let u1:UTXO = new UTXO(bintools.avaSerialize(utxobuff));;
        let u1hex:string = u1.toBuffer().toString("hex"); 
        test('getAmount', () => {
            expect(u1.getAmount().toNumber()).toBe(12345);
        });
        test('getAssetID', () => {
            let assetid:Buffer = u1.getAssetID();
            expect(assetid.toString("hex", 0, assetid.length)).toBe("8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533");
        });
        test('getTxID', () => {
            let txid:Buffer = u1.getTxID();
            expect(txid.toString("hex", 0, txid.length)).toBe("f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7");
        });
        test('getTxIdx', () => {
            let txidx:Buffer = u1.getTxIdx();
            expect(txidx.toString("hex", 0, txidx.length)).toBe("00000001");
        });
        test('getUTXOID', () => {
            let txid:Buffer = Buffer.from("f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7", "hex");
            let txidx:Buffer = Buffer.from("00000001", "hex");
            let utxoid:string = bintools.bufferToB58(Buffer.concat([txid, txidx]))
            expect(u1.getUTXOID()).toBe(utxoid);
        });
        test('toString', () => {
            let serialized:string = u1.toString();
            expect(serialized).toBe(bintools.avaSerialize(utxobuff));
        });

        test('getAddresses', () => {
            let addresses:{ [address: string]: BN } = u1.getAddresses();
            let expected:{ [address: string]: BN; } = {};
            expected[opaddr] = new BN(oplocktime, "hex");
            expected[toladdr] = new BN(tollocktime, "hex");
            const addrs = Object.keys(addresses);
            for( let x of addrs ){
                expect(expected[x]).not.toBeUndefined();
                expect(expected[x].toNumber()).toBe(addresses[x].toNumber());
            }
        });
        test('getAddressIdx', () => {
            let addropinfo:[number, boolean] = u1.getAddressIdx(opaddr);
            expect(addropinfo[1]).toBe(false);
            expect(addropinfo[0]).toBe(0);
            let addrtolinfo:[number, boolean] = u1.getAddressIdx(toladdr);
            expect(addrtolinfo[1]).toBe(true);
            expect(addrtolinfo[0]).toBe(0);
        });

        test('getAddress', () => {
            let recaddr1 = u1.getAddress(0, false);
            expect(recaddr1).toBe(opaddr);
            let recaddr2 = u1.getAddress(0, true);
            expect(recaddr2).toBe(toladdr);
        });

        test('getSpenders', () => {
            let addrs = [opaddr, toladdr];

            let thepast = u1.getSpenders(addrs, new BN(1));
            expect(thepast.length).toBe(0);

            let thefuture = u1.getSpenders(addrs, new BN(1893529613));
            expect(thefuture.length).toBe(2);

            let theinbetween = u1.getSpenders(addrs, new BN(55321));
            expect(theinbetween.length).toBe(1);

            let exactlyOP = u1.getSpenders(addrs, new BN(54321));
            expect(exactlyOP.length).toBe(0);

            let exactlyTOL = u1.getSpenders(addrs, new BN(56789));
            expect(exactlyTOL.length).toBe(1);
        });

        test('meetsThreshold', () => {
            let addrs = [opaddr, toladdr];
            let thepast = u1.meetsThreshold(addrs, new BN(1));
            expect(thepast).toBe(false);

            let thefuture = u1.meetsThreshold(addrs, new BN(1893529613));
            expect(thefuture).toBe(true);

            let theinbetween = u1.meetsThreshold(addrs, new BN(55321));
            expect(theinbetween).toBe(true);

            let exactlyOP = u1.meetsThreshold(addrs, new BN(54321));
            expect(exactlyOP).toBe(false);

            let exactlyTOL = u1.meetsThreshold(addrs, new BN(56789));
            expect(exactlyTOL).toBe(true);

            exactlyTOL = u1.meetsThreshold([toladdr], new BN(56789));
            expect(exactlyTOL).toBe(false);
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
        "49N8kgxkXtuTG5tsTy7UccvKgJq9ZvyvXULbyCj2GRuc9Vrn5nv5K8t4NcA4omVjg8iYJ3HhZa3HSyizaWGr9X3XZhBTEweUvuxcaHzd3uGig2q6cESdW5rWqWs5mejSKMiqNBVEPMjfSUv3kvzKnnQPi4v7ejKaurNu",
        "49N8kgxkXtuTG5tsTy7UccvKgJq9ZvyvXULbyCj2GRuc9Vrn1hcK6XnoPGo1T2nQyRrkpbBCELfEpXbPPUFGNSLYz9WmSz1Gi1VQowzyppBhGGNzqVCeWMLyK1K7aPW8JGZQbJ4Y1KzG5XqqhUkxY2ZZMRBTbkzqJ3CP",
        "49N8kgxkXtuTG5tsTy7UccvKgJq9ZvyvXULbyCj2GRuc9Vrn2L7pCw2zcZA6Rm3hEcc7CfCCHJFrv8qwa6FWVNbn9mcieWscS9ZbYTr16DGvs9qKa4d7817frUAeXfEKzbCascE3aWgaAqSDAZXCUT4QifCzYgJuK17g"
    ];
    let addrs:Array<string> = [
        "B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW",
        "P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF",
        "6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV"
    ];
    test('Creation', () => {
        let set:UTXOSet = new UTXOSet();
        set.add(utxostrs[0]);
        let utxo:UTXO = new UTXO(utxostrs[0]);
        let setArray:Array<UTXO> = set.getAllUTXOs();
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
            let utxo:UTXO = new UTXO(utxostrs[i]);
            let veriutxo:UTXO = set.getUTXO(utxo.getUTXOID());
            expect(veriutxo.toString()).toBe(utxostrs[i]);
        }

    });

    test('addArray', () => {
        let set:UTXOSet = new UTXOSet();
        set.addArray(utxostrs);
        for(let i:number = 0; i < utxostrs.length; i++){
            expect(set.includes(new UTXO(utxostrs[i]))).toBe(true);
            let utxo:UTXO = new UTXO(utxostrs[i]);
            let veriutxo:UTXO = set.getUTXO(utxo.getUTXOID());
            expect(veriutxo.toString()).toBe(utxostrs[i]);
        }

        set.addArray(set.getAllUTXOs());
        for(let i:number = 0; i < utxostrs.length; i++){
            expect(set.includes(new UTXO(utxostrs[i]))).toBe(true);
            let utxo:UTXO = new UTXO(utxostrs[i]);
            let veriutxo:UTXO = set.getUTXO(utxo.getUTXOID());
            expect(veriutxo.toString()).toBe(utxostrs[i]);
        }
    });

    test('overwriting UTXOs', () => {
        let set:UTXOSet = new UTXOSet();
        set.addArray(utxostrs);
        expect(set.add(utxostrs[0], true)).toBe(true);
        expect(set.add(utxostrs[0], false)).toBe(false);
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
            let allutxos:Array<UTXO> = set.getAllUTXOs();
            let ustrs:Array<string> = [];
            for(let i:number = 0; i < allutxos.length; i++){
                ustrs.push(allutxos[i].toString());
            }
            for(let i:number = 0; i < utxostrs.length; i++) {
                expect(ustrs.indexOf(utxostrs[i])).not.toBe(-1);
            }
            let uids:Array<string> = set.getUTXOIDs();
            let allutxos2:Array<UTXO> = set.getAllUTXOs(uids);
            let ustrs2:Array<string> = [];
            for(let i:number = 0; i < allutxos.length; i++){
                ustrs2.push(allutxos2[i].toString());
            }
            for(let i:number = 0; i < utxostrs.length; i++) {
                expect(ustrs2.indexOf(utxostrs[i])).not.toBe(-1);
            }
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

        test('getUTXOIDsByAddress', () => {
            let utxoids:Array<string>;
            utxoids = set.getUTXOIDsByAddress(addrs[0]);
            expect(utxoids.length).toBe(1);
            utxoids = set.getUTXOIDsByAddress(addrs);
            expect(utxoids.length).toBe(3);
            utxoids = set.getUTXOIDsByAddress(addrs, false);
            expect(utxoids.length).toBe(3);
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
            let newutxo:string = "2ACVKeLATDeZ9h3MkMbSS7uTfic51anX6GdmaUwBH3Q6poMBGxm4xv5qvaSfpRYATDoffXRVpdUwh2GWxuToTbn67HE42kPH91Lhs2cQqzY76ZXv23z73EUCkoBfmLFjB72SHcT2xsWXx55uv9iSrMjrb5gXhRMCRr2Q59qLEDGogoa1j4XzND82DwmSNcWqXqQCw8Mt6TAJRee2V8pGpC";
            
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
                let setArray:Array<UTXO> = setG.getAllUTXOs();      
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

