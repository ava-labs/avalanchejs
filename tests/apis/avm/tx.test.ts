import { UTXOSet, UTXO } from 'src/apis/avm/utxos';
import { TxUnsigned, Tx } from 'src/apis/avm/tx';
import { AVMKeyChain } from 'src/apis/avm/keychain';
import { Input } from 'src/apis/avm/inputs';
import createHash from 'create-hash';
import BinTools from 'src/utils/bintools';
import BN from 'bn.js';
import {Buffer} from "buffer/";
import { Output, OutPayment, OutTakeOrLeave, OutCreateAsset } from 'src/apis/avm/outputs';
import { UnixNow } from 'src/apis/avm/types';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();
describe('Transactions', () => {
    let set:UTXOSet;
    let keymgr1:AVMKeyChain;
    let keymgr2:AVMKeyChain;
    let keymgr3:AVMKeyChain;
    let addrs1:Array<string>;
    let addrs2:Array<string>;
    let addrs3:Array<string>;
    let utxos:Array<UTXO>;
    let inputs:Array<Input>;
    let outputs:Array<Output>;
    const amnt:number = 10000;
    let netid:number = 49;
    let blockchainID:Buffer = Buffer.from(createHash("sha256").update("I am the very model of a modern major general").digest());
    let assetID:Buffer = Buffer.from(createHash("sha256").update("mary had a little lamb").digest());
    beforeEach(() => {
        set = new UTXOSet();
        keymgr1 = new AVMKeyChain();
        keymgr2 = new AVMKeyChain();
        keymgr3 = new AVMKeyChain();
        addrs1 = [];
        addrs2 = [];
        addrs3 = [];
        utxos = [];
        inputs = [];
        outputs = [];

        for(let i:number = 0; i < 3; i++){
            addrs1.push(keymgr1.makeKey());
            addrs2.push(keymgr2.makeKey());
            addrs3.push(keymgr3.makeKey());
        }
        let amount:BN = new BN(amnt);
        let addresses:Array<string> = keymgr1.getAddresses();
        let fallAddresses:Array<string> = keymgr2.getAddresses()
        let locktime:BN = new BN(54321);
        let fallLocktime:BN = locktime.add(new BN(50));
        let threshold:number = 3;
        let fallThreshold:number = 1;
        
        for(let i:number = 0; i < 5; i++){
            let txid:Buffer = Buffer.from(createHash("sha256").update(bintools.fromBNToBuffer(new BN(i), 32)).digest());
            let txidx:Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(i), 4));
            let out:Output;
            switch(i % 3){
                case 0:
                    out = new OutPayment(assetID, amount, addresses, locktime, threshold);
                    break; 
                case 1:
                    out = new OutTakeOrLeave(assetID, amount, addresses, fallAddresses, locktime, fallLocktime, threshold, fallThreshold);
                    break;
                case 2:
                    out = new OutCreateAsset(amount, addresses, locktime, threshold);
                    break;
            }
            outputs.push(out);

            let u:UTXO = new UTXO();
            u.fromBuffer(Buffer.concat([txid, txidx, out.toBuffer()]));
            utxos.push(u);

            txid = u.getTxID();
            txidx = u.getTxIdx();

            let input:Input = new Input(txid, txidx, amount);
            inputs.push(input);
        }
        set.addArray(utxos);
    });

    test('Creation TxUnsigned', () => {
        let txu:TxUnsigned = new TxUnsigned(inputs, outputs, netid, blockchainID, 99);
        let txins:Array<Input>  = txu.getIns();
        let txouts:Array<Output> = txu.getOuts();
        expect(txins.length).toBe(inputs.length);
        expect(txouts.length).toBe(outputs.length);
        
        expect(txu.getCodec()).toBe(99);
        expect(txu.getNetworkID()).toBe(49);
        expect(txu.getBlockchainID().toString("hex")).toBe(blockchainID.toString("hex"));
        
        let a:Array<string> = [];
        let b:Array<string> = [];
        for(let i:number = 0; i < txins.length; i++){
            a.push(txins[i].toString());
            b.push(inputs[i].toString());
        }
        expect(JSON.stringify(a.sort())).toBe(JSON.stringify(b.sort()));
        
        a = [];
        b = [];

        for(let i:number = 0; i < txouts.length; i++){
            a.push(txouts[i].toString());
            b.push(outputs[i].toString());
        }
        expect(JSON.stringify(a.sort())).toBe(JSON.stringify(b.sort()));

        let txunew:TxUnsigned = new TxUnsigned();
        txunew.fromBuffer(txu.toBuffer());
        expect(txunew.toBuffer().toString("hex")).toBe(txu.toBuffer().toString("hex"));
        expect(txunew.toString()).toBe(txu.toString());
    });

    test('Creation TxUnsigned Check Amount', () => {
        expect(() => {
            set.makeUnsignedTx(
                netid, blockchainID,
                new BN(amnt * 1000), 
                addrs3, addrs1, addrs1, assetID
            );
        }).toThrow();
    });

    test('Creation Tx1', () => {
        let txu:TxUnsigned = set.makeUnsignedTx(
            netid, blockchainID,
            new BN(9000), 
            addrs3, addrs1, addrs1, assetID, 
            UnixNow(), UnixNow().add(new BN(50)), 3, 
            addrs2, UnixNow().add(new BN(100)), 2
        );
        let tx:Tx = keymgr1.signTx(txu);
        let tx2:Tx = new Tx();
        tx2.fromString(tx.toString());
        expect(tx2.toBuffer().toString("hex")).toBe(tx.toBuffer().toString("hex"));
        expect(tx2.toString()).toBe(tx.toString());
    });
    test('Creation Tx2', () => {
        let txu:TxUnsigned = set.makeUnsignedTx(
            netid, blockchainID,
            new BN(9000), 
            addrs3, addrs1, addrs1, assetID
        );
        let tx:Tx = keymgr1.signTx(txu);
        let tx2:Tx = new Tx();
        tx2.fromString(tx.toString());
        expect(tx2.toBuffer().toString("hex")).toBe(tx.toBuffer().toString("hex"));
        expect(tx2.toString()).toBe(tx.toString());
    });
    test('Creation Tx3', () => {
        let txu:TxUnsigned = set.makeUnsignedTx(
            netid, blockchainID,
            new BN(9000), 
            addrs3, addrs1, addrs1
        );
        let tx:Tx = keymgr1.signTx(txu);
        let tx2:Tx = new Tx();
        tx2.fromString(tx.toString());
        expect(tx2.toBuffer().toString("hex")).toBe(tx.toBuffer().toString("hex"));
        expect(tx2.toString()).toBe(tx.toString());
    });
});
    