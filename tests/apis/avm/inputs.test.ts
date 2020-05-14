import { UTXOSet, UTXO } from 'src/apis/avm/utxos';
import { AVMKeyChain } from 'src/apis/avm/keychain';
import { SecpInput, TransferableInput } from 'src/apis/avm/inputs';
import createHash from 'create-hash';
import BinTools from 'src/utils/bintools';
import BN from 'bn.js';
import {Buffer} from "buffer/";
import { Output, SecpOutput } from 'src/apis/avm/outputs';
import { AVMConstants } from 'src/apis/avm/types';
import { AmountOutput, TransferableOutput } from '../../../src/apis/avm/outputs';


/**
 * @ignore
 */
const bintools = BinTools.getInstance();
describe('Inputs', () => {
    let set:UTXOSet;
    let keymgr1:AVMKeyChain;
    let keymgr2:AVMKeyChain;
    let addrs1:Array<Buffer>;
    let addrs2:Array<Buffer>;
    let utxos:Array<UTXO>;
    const amnt:number = 10000;
    beforeEach(() => {
        set = new UTXOSet();
        keymgr1 = new AVMKeyChain("X");
        keymgr2 = new AVMKeyChain("X");
        addrs1 = [];
        addrs2 = [];
        utxos = [];
        for(let i:number = 0; i < 3; i++){
            addrs1.push(keymgr1.makeKey());
            addrs2.push(keymgr2.makeKey());
        }
        let amount:BN = new BN(amnt);
        let addresses:Array<Buffer> = keymgr1.getAddresses();
        let fallAddresses:Array<Buffer> = keymgr2.getAddresses()
        let locktime:BN = new BN(54321);
        let fallLocktime:BN = locktime.add(new BN(50));
        let threshold:number = 3;
        let fallThreshold:number = 1;
        
        for(let i:number = 0; i < 3; i++){
            let txid:Buffer = Buffer.from(createHash("sha256").update(bintools.fromBNToBuffer(new BN(i), 32)).digest());
            let txidx:Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(i), 4));
            let assetID:Buffer = Buffer.from(createHash("sha256").update(txid).digest());
            let out:Output;
            out = new SecpOutput(amount, locktime, threshold, addresses);
            let xferout:TransferableOutput = new TransferableOutput(assetID, out);
            let u:UTXO = new UTXO();
            u.fromBuffer(Buffer.concat([txid, txidx, xferout.toBuffer()]));
            utxos.push(u);
        }
        set.addArray(utxos);
    });
    test('SecpInput', () => {
        let u:UTXO;
        let txid:Buffer;
        let txidx:Buffer;
        let amount:BN = new BN(amnt);
        let input:SecpInput;
        let xferinput:TransferableInput;

        u = utxos[0];
        txid = u.getTxID();
        txidx = u.getOutputIdx();
        let asset = u.getAssetID();

        input = new SecpInput(amount);
        xferinput = new TransferableInput(txid, txidx, asset, input);
        expect(xferinput.getUTXOID()).toBe(u.getUTXOID());
        expect(input.getInputID()).toBe(AVMConstants.SECPINPUTID);

        input.addSignatureIdx(0, addrs2[0]);
        input.addSignatureIdx(1, addrs2[1]);

        let newin:SecpInput = new SecpInput();
        newin.fromBuffer(bintools.b58ToBuffer(input.toString()));
        expect(newin.toBuffer().toString("hex")).toBe(input.toBuffer().toString("hex"));
        expect(newin.getSigIdxs().toString()).toBe(input.getSigIdxs().toString());
    });
    test('comparitor', () => {
        let inpt1:SecpInput = new SecpInput((utxos[0].getOutput() as AmountOutput).getAmount());
        let in1:TransferableInput = new TransferableInput(utxos[0].getTxID(), utxos[0].getOutputIdx(), utxos[0].getAssetID(), inpt1);

        let inpt2:SecpInput = new SecpInput((utxos[1].getOutput() as AmountOutput).getAmount());
        let in2:TransferableInput = new TransferableInput(utxos[1].getTxID(), utxos[1].getOutputIdx(), utxos[1].getAssetID(), inpt2);


        let inpt3:SecpInput = new SecpInput((utxos[2].getOutput() as AmountOutput).getAmount());
        let in3:TransferableInput = new TransferableInput(utxos[2].getTxID(), utxos[2].getOutputIdx(), utxos[2].getAssetID(), inpt3);

        let cmp = TransferableInput.comparator();
        expect(cmp(in1, in2)).toBe(-1);
        expect(cmp(in1, in3)).toBe(-1);
        expect(cmp(in1, in1)).toBe(0);
        expect(cmp(in2, in2)).toBe(0);
        expect(cmp(in3, in3)).toBe(0);
    });

});