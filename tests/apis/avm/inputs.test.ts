import { UTXOSet, UTXO, SecpUTXO } from 'src/apis/avm/utxos';
import { AVMKeyChain } from 'src/apis/avm/keychain';
import { Input, SecpInput } from 'src/apis/avm/inputs';
import createHash from 'create-hash';
import BinTools from 'src/utils/bintools';
import BN from 'bn.js';
import {Buffer} from "buffer/";
import { Output, SecpOutput } from 'src/apis/avm/outputs';
import { Constants } from 'src/apis/avm/types';


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
    let utxos:Array<SecpUTXO>;
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
            out = new SecpOutput(assetID, amount, addresses, locktime, threshold);
            let u:SecpUTXO = new SecpUTXO();
            u.fromBuffer(Buffer.concat([txid, txidx, out.toBuffer()]));
            utxos.push(u);
        }
        set.addArray(utxos);
    });
    test('SecpInput', () => {
        let u:SecpUTXO;
        let txid:Buffer;
        let txidx:Buffer;
        let amount:BN = new BN(amnt);
        let input:SecpInput;

        u = utxos[0];
        txid = u.getTxID();
        txidx = u.getTxIdx();
        let asset = u.getAssetID();

        input = new SecpInput(txid, txidx, amount, asset);
        expect(input.getUTXOID()).toBe(u.getUTXOID());
        expect(input.getInputID()).toBe(Constants.SECPINPUTID);

        input.addSignatureIdx(0, addrs2[0]);
        input.addSignatureIdx(1, addrs2[1]);

        let newin:SecpInput = new SecpInput();
        newin.fromBuffer(bintools.b58ToBuffer(input.toString()));
        expect(newin.toBuffer().toString("hex")).toBe(input.toBuffer().toString("hex"));
        expect(newin.getSigIdxs().toString()).toBe(input.getSigIdxs().toString());
    });
    test('comparitor', () => {
        let in1:SecpInput = new SecpInput(utxos[0].getTxID(), utxos[0].getTxIdx(), utxos[0].getAmount(), utxos[0].getAssetID());
        let in2:SecpInput = new SecpInput(utxos[1].getTxID(), utxos[1].getTxIdx(), utxos[1].getAmount(), utxos[1].getAssetID());
        let in3:SecpInput = new SecpInput(utxos[2].getTxID(), utxos[2].getTxIdx(), utxos[2].getAmount(), utxos[2].getAssetID());

        let cmp = SecpInput.comparator();
        expect(cmp(in1, in2)).toBe(-1);
        expect(cmp(in1, in3)).toBe(-1);
        expect(cmp(in1, in1)).toBe(0);
        expect(cmp(in2, in2)).toBe(0);
        expect(cmp(in3, in3)).toBe(0);
    });

});