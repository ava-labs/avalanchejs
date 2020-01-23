import { UTXOSet, UTXO } from 'src/apis/avm/utxos';
import { AVMKeyChain } from 'src/apis/avm/keychain';
import { Input } from 'src/apis/avm/inputs';
import createHash from 'create-hash';
import BinTools from 'src/utils/bintools';
import BN from 'bn.js';
import {Buffer} from "buffer/";
import { Output, OutPayment, OutTakeOrLeave, OutCreateAsset } from 'src/apis/avm/outputs';


/**
 * @ignore
 */
const bintools = BinTools.getInstance();
describe('Inputs', () => {
    let set:UTXOSet;
    let keymgr1:AVMKeyChain;
    let keymgr2:AVMKeyChain;
    let addrs1:Array<string>;
    let addrs2:Array<string>;
    let utxos:Array<UTXO>;
    const amnt:number = 10000;
    beforeEach(() => {
        set = new UTXOSet();
        keymgr1 = new AVMKeyChain();
        keymgr2 = new AVMKeyChain();
        addrs1 = [];
        addrs2 = [];
        utxos = [];
        for(let i:number = 0; i < 3; i++){
            addrs1.push(keymgr1.makeKey());
            addrs2.push(keymgr2.makeKey());
        }
        let amount:BN = new BN(amnt);
        let addresses:Array<string> = keymgr1.getAddreses();
        let fallAddresses:Array<string> = keymgr2.getAddreses()
        let locktime:BN = new BN(54321);
        let fallLocktime:BN = locktime.add(new BN(50));
        let threshold:number = 3;
        let fallThreshold:number = 1;
        
        for(let i:number = 0; i < 5; i++){
            let txid:Buffer = Buffer.from(createHash("sha256").update(bintools.fromBNToBuffer(new BN(i), 32)).digest());
            let txidx:Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(i), 4));
            let assetID:Buffer = Buffer.from(createHash("sha256").update(txid).digest());
            let out:Output;
            switch(i % 3){
                case 0:
                    out = new OutPayment(assetID, amount, addresses, locktime, threshold);
                    break; 
                case 1:
                    out = new OutTakeOrLeave(assetID, amount, addresses, fallAddresses, locktime, fallLocktime, threshold, fallThreshold);
                    break;
                case 2:
                    out = new OutCreateAsset(amount);
                    break;
            }
            let u:UTXO = new UTXO();
            u.fromBuffer(Buffer.concat([txid, txidx, out.toBuffer()]));
            utxos.push(u);
        }
        set.addArray(utxos);
    });
    test('OutPayment', () => {
        let u:UTXO;
        let txid:Buffer;
        let txidx:Buffer;
        let amount:BN = new BN(amnt);
        let input:Input;

        u = utxos[0];
        txid = u.getTxID();
        txidx = u.getTxIdx();

        input = new Input(txid, txidx, amount);
        expect(input.getUTXOID()).toBe(u.getUTXOID());
        expect(input.getInputType()).toBe(0);

        input.addSignatureIdx(0, addrs2[0]);
        input.addSignatureIdx(1, addrs2[1]);

        let newin:Input = new Input();
        newin.fromBuffer(bintools.b58ToBuffer(input.toString()));
        expect(newin.toBuffer().toString("hex")).toBe(input.toBuffer().toString("hex"));
        expect(newin.getSigIdxs().toString()).toBe(input.getSigIdxs().toString());
    });

    test('OutTakeOrLeave', () => {
        let u:UTXO;
        let txid:Buffer;
        let txidx:Buffer;
        let amount:BN = new BN(amnt);
        let input:Input;

        u = utxos[1];
        txid = u.getTxID();
        txidx = u.getTxIdx();

        input = new Input(txid, txidx, amount);
        expect(input.getUTXOID()).toBe(u.getUTXOID());
        expect(input.getInputType()).toBe(0);

        input.addSignatureIdx(0, addrs2[0]);
        input.addSignatureIdx(1, addrs2[1]);

        let newin:Input = new Input();
        newin.fromBuffer(bintools.b58ToBuffer(input.toString()));
        expect(newin.toBuffer().toString("hex")).toBe(input.toBuffer().toString("hex"));
        expect(newin.getSigIdxs().toString()).toBe(input.getSigIdxs().toString());
    });

    test('OutCreateAsset', () => {
        let u:UTXO;
        let txid:Buffer;
        let txidx:Buffer;
        let amount:BN = new BN(amnt);
        let input:Input;

        u = utxos[2];
        txid = u.getTxID();
        txidx = u.getTxIdx();

        input = new Input(txid, txidx, amount);
        expect(input.getUTXOID()).toBe(u.getUTXOID());
        expect(input.getInputType()).toBe(0);

        input.addSignatureIdx(0, addrs2[0]);
        input.addSignatureIdx(1, addrs2[1]);

        let newin:Input = new Input();
        newin.fromBuffer(bintools.b58ToBuffer(input.toString()));
        expect(newin.toBuffer().toString("hex")).toBe(input.toBuffer().toString("hex"));
        expect(newin.getSigIdxs().toString()).toBe(input.getSigIdxs().toString());
    });

    test('comparitor', () => {
        let in1:Input = new Input(utxos[0].getTxID(), utxos[0].getTxIdx(), utxos[0].getAmount());
        let in2:Input = new Input(utxos[1].getTxID(), utxos[1].getTxIdx(), utxos[1].getAmount());
        let in3:Input = new Input(utxos[2].getTxID(), utxos[2].getTxIdx(), utxos[2].getAmount());

        let cmp = Input.comparitor();
        expect(cmp(in1, in2)).toBe(-1);
        expect(cmp(in1, in3)).toBe(-1);
        expect(cmp(in1, in1)).toBe(0);
        expect(cmp(in2, in2)).toBe(0);
        expect(cmp(in3, in3)).toBe(0);
    });

});