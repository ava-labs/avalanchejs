import { UTXOSet, UTXO, SecpUTXO } from 'src/apis/avm/utxos';
import { TxUnsigned, TxCreateAsset, Tx } from 'src/apis/avm/tx';
import { AVMKeyChain } from 'src/apis/avm/keychain';
import { Input, SecpInput } from 'src/apis/avm/inputs';
import createHash from 'create-hash';
import BinTools from 'src/utils/bintools';
import BN from 'bn.js';
import {Buffer} from "buffer/";
import { Output, SecpOutput, SecpOutBase } from 'src/apis/avm/outputs';
import { UnixNow, AVMConstants} from 'src/apis/avm/types';
import { InitialStates } from '../../../src/apis/avm/types';
/**
 * @ignore
 */
const bintools = BinTools.getInstance();
describe('Transactions', () => {
    let set:UTXOSet;
    let keymgr1:AVMKeyChain;
    let keymgr2:AVMKeyChain;
    let keymgr3:AVMKeyChain;
    let addrs1:Array<Buffer>;
    let addrs2:Array<Buffer>;
    let addrs3:Array<Buffer>;
    let utxos:Array<SecpUTXO>;
    let inputs:Array<SecpInput>;
    let outputs:Array<Output>;
    const amnt:number = 10000;
    let netid:number = 12345;
    let blockchainID:Buffer = Buffer.from(createHash("sha256").update("I am the very model of a modern major general").digest());
    let alias:string = "X";
    let assetID:Buffer = Buffer.from(createHash("sha256").update("mary had a little lamb").digest());
    beforeEach(() => {
        set = new UTXOSet();
        keymgr1 = new AVMKeyChain(alias);
        keymgr2 = new AVMKeyChain(alias);
        keymgr3 = new AVMKeyChain(alias);
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
        let addresses:Array<Buffer> = keymgr1.getAddresses();
        let fallAddresses:Array<Buffer> = keymgr2.getAddresses();
        let locktime:BN = new BN(54321);
        let fallLocktime:BN = locktime.add(new BN(50));
        let threshold:number = 3;
        let fallThreshold:number = 1;
        for(let i:number = 0; i < 5; i++){
            let txid:Buffer = Buffer.from(createHash("sha256").update(bintools.fromBNToBuffer(new BN(i), 32)).digest());
            let txidx:Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(i), 4));
            let out:SecpOutput;
            out = new SecpOutput(assetID, amount, addresses, locktime, threshold);
            outputs.push(out);

            let u:SecpUTXO = new SecpUTXO();
            u.fromBuffer(Buffer.concat([txid, txidx, out.toBuffer()]));
            utxos.push(u);

            txid = u.getTxID();
            txidx = u.getTxIdx();
            let asset = u.getAssetID();

            let input:SecpInput = new SecpInput(txid, txidx, amount, asset);
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
        
        expect(txu.getTxType()).toBe(99);
        expect(txu.getNetworkID()).toBe(12345);
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
            UnixNow(), UnixNow().add(new BN(50)), 1
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

    test('Asset Creation Tx', () => {
        let secpbase1:SecpOutBase = new SecpOutBase(new BN(777), addrs3);
        let secpbase2:SecpOutBase = new SecpOutBase(new BN(888), addrs2);
        let secpbase3:SecpOutBase = new SecpOutBase(new BN(999), addrs2);
        let initialState:InitialStates = new InitialStates();
        initialState.addOutput(secpbase1, AVMConstants.SECPFXID);
        initialState.addOutput(secpbase2, AVMConstants.SECPFXID);
        initialState.addOutput(secpbase3, AVMConstants.SECPFXID);
        let name:string = "Rickcoin is the most intelligent coin";
        let symbol:string = "RICK";
        let denomination:number = 9;
        let txu:TxCreateAsset = new TxCreateAsset(name, symbol, denomination, initialState, inputs, outputs, netid, blockchainID, AVMConstants.CREATEASSETTX);
        let txins:Array<Input>  = txu.getIns();
        let txouts:Array<Output> = txu.getOuts();
        let initState:InitialStates = txu.getInitialStates();
        expect(txins.length).toBe(inputs.length);
        expect(txouts.length).toBe(outputs.length);
        expect(initState.toBuffer().toString("hex")).toBe(initialState.toBuffer().toString("hex"));
        
        expect(txu.getTxType()).toBe(AVMConstants.CREATEASSETTX);
        expect(txu.getNetworkID()).toBe(12345);
        expect(txu.getBlockchainID().toString("hex")).toBe(blockchainID.toString("hex"));
        expect(txu.getName()).toBe(name);
        expect(txu.getNameBuffer().toString("hex")).toBe(bintools.stringToBuffer(name).toString("hex"));
        expect(txu.getSymbol()).toBe(symbol);
        expect(txu.getSymbolBuffer().toString("hex")).toBe(bintools.stringToBuffer(symbol).toString("hex"));
        expect(txu.getDenomination()).toBe(denomination);
        expect(txu.getDenominationBuffer().readUInt8(0)).toBe(denomination);

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

        let txunew:TxCreateAsset = new TxCreateAsset();
        txunew.fromBuffer(txu.toBuffer());
        expect(txunew.toBuffer().toString("hex")).toBe(txu.toBuffer().toString("hex"));
        expect(txunew.toString()).toBe(txu.toString());
    });
});
    