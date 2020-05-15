import { UTXOSet, UTXO } from 'src/apis/avm/utxos';
import { BaseTx, CreateAssetTx, UnsignedTx, Tx } from 'src/apis/avm/tx';
import { AVMKeyChain } from 'src/apis/avm/keychain';
import { Input, SecpInput, TransferableInput } from 'src/apis/avm/inputs';
import createHash from 'create-hash';
import BinTools from 'src/utils/bintools';
import BN from 'bn.js';
import {Buffer} from "buffer/";
import { Output, SecpOutput, TransferableOutput} from 'src/apis/avm/outputs';
import { UnixNow, AVMConstants, InitialStates } from 'src/apis/avm/types';

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
    let utxos:Array<UTXO>;
    let inputs:Array<TransferableInput>;
    let outputs:Array<TransferableOutput>;
    const amnt:number = 10000;
    let netid:number = 12345;
    let blockchainID:Buffer = Buffer.from(createHash("sha256").update("I am the very model of a modern major general").digest());
    let alias:string = "X";
    let assetID:Buffer = Buffer.from(createHash("sha256").update("mary had a little lamb").digest());
    let amount:BN;
    let addresses:Array<Buffer>;
    let fallAddresses:Array<Buffer>;
    let locktime:BN;
    let fallLocktime:BN;
    let threshold:number;
    let fallThreshold:number;
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
        amount = new BN(amnt);
        addresses = keymgr1.getAddresses();
        fallAddresses = keymgr2.getAddresses();
        locktime = new BN(54321);
        fallLocktime = locktime.add(new BN(50));
        threshold = 3;
        fallThreshold = 1;
        for(let i:number = 0; i < 5; i++){
            let txid:Buffer = Buffer.from(createHash("sha256").update(bintools.fromBNToBuffer(new BN(i), 32)).digest());
            let txidx:Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(i), 4));
            let out:SecpOutput;
            out = new SecpOutput(amount, locktime, threshold, addresses);
            let xferout:TransferableOutput = new TransferableOutput(assetID, out);
            outputs.push(xferout);

            let u:UTXO = new UTXO(txid, txidx, assetID, out);
            utxos.push(u);

            txid = u.getTxID();
            txidx = u.getOutputIdx();
            let asset = u.getAssetID();

            let input:SecpInput = new SecpInput(amount);
            let xferin:TransferableInput = new TransferableInput(txid, txidx, assetID, input);
            inputs.push(xferin);
        }
        set.addArray(utxos);
    });

    test('Creation UnsignedTx', () => {
        let baseTx:BaseTx = new BaseTx(netid, blockchainID, outputs, inputs);
        let txu:UnsignedTx = new UnsignedTx(baseTx);
        let txins:Array<TransferableInput>  = txu.getTransaction().getIns();
        let txouts:Array<TransferableOutput> = txu.getTransaction().getOuts();
        expect(txins.length).toBe(inputs.length);
        expect(txouts.length).toBe(outputs.length);
        
        expect(txu.getTransaction().getTxType()).toBe(99);
        expect(txu.getTransaction().getNetworkID()).toBe(12345);
        expect(txu.getTransaction().getBlockchainID().toString("hex")).toBe(blockchainID.toString("hex"));
        
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

        let txunew:UnsignedTx = new UnsignedTx();
        txunew.fromBuffer(txu.toBuffer());
        expect(txunew.toBuffer().toString("hex")).toBe(txu.toBuffer().toString("hex"));
        expect(txunew.toString()).toBe(txu.toString());
    });

    test('Creation UnsignedTx Check Amount', () => {
        expect(() => {
            set.makeBaseTx(
                netid, blockchainID,
                new BN(amnt * 1000), 
                addrs3, addrs1, addrs1, assetID
            );
        }).toThrow();
    });

    test('Creation Tx1', () => {
        let txu:UnsignedTx = set.makeBaseTx(
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
        let txu:UnsignedTx = set.makeBaseTx(
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

    test('CreateAssetTX', () => {
        let secpbase1:SecpOutput = new SecpOutput(new BN(777), locktime, 1, addrs3);
        let secpbase2:SecpOutput = new SecpOutput(new BN(888), locktime, 1, addrs2);
        let secpbase3:SecpOutput = new SecpOutput(new BN(999), locktime, 1, addrs2);
        let initialState:InitialStates = new InitialStates();
        initialState.addOutput(secpbase1, AVMConstants.SECPFXID);
        initialState.addOutput(secpbase2, AVMConstants.SECPFXID);
        initialState.addOutput(secpbase3, AVMConstants.SECPFXID);
        let name:string = "Rickcoin is the most intelligent coin";
        let symbol:string = "RICK";
        let denomination:number = 9;
        let txu:CreateAssetTx = new CreateAssetTx(netid, blockchainID, outputs, inputs, name, symbol, denomination, initialState);
        let txins:Array<TransferableInput>  = txu.getIns();
        let txouts:Array<TransferableOutput> = txu.getOuts();
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

        let txunew:CreateAssetTx = new CreateAssetTx();
        txunew.fromBuffer(txu.toBuffer());
        expect(txunew.toBuffer().toString("hex")).toBe(txu.toBuffer().toString("hex"));
        expect(txunew.toString()).toBe(txu.toString());
    });
});
    