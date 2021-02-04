import { UTXO } from 'src/apis/avm/utxos';
import createHash from 'create-hash';
import BinTools from 'src/utils/bintools';
import BN from 'bn.js';
import {Buffer} from "buffer/";
import { NFTTransferOutput } from 'src/apis/avm/outputs';
import { AVMConstants } from 'src/apis/avm/constants';
import { SelectOperationClass, Operation, TransferableOperation, NFTTransferOperation, NFTMintOperation } from 'src/apis/avm/ops';
import { OutputOwners } from 'src/common/output';
import { SigIdx } from 'src/common/credentials';
import { UTXOID } from 'src/apis/avm/ops';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

describe('Operations', () => {
    const codecID_zero: number = 0;
    const codecID_one: number = 1;
    let assetID:string = "8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533";
    let assetIDBuff:Buffer = Buffer.from(assetID, "hex");
    let addrs:Array<Buffer> = [
        bintools.cb58Decode("B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW"),
        bintools.cb58Decode("P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF"),
        bintools.cb58Decode("6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV")
    ].sort();

    let locktime:BN = new BN(54321);

    let payload:Buffer = Buffer.alloc(1024);
    payload.write("All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.", 0, 1024, "utf8" );

    describe('NFTMintOperation', () => {
        test('SelectOperationClass', () => {
            let goodop:NFTMintOperation = new NFTMintOperation(0, Buffer.from(""), []);
            let operation:Operation = SelectOperationClass(goodop.getOperationID());
            expect(operation).toBeInstanceOf(NFTMintOperation);
            expect(() => {
                SelectOperationClass(99);
            }).toThrow("Error - SelectOperationClass: unknown opid");
        });

        test('comparator', () => {
            let outputOwners:Array<OutputOwners> = [];
            outputOwners.push(new OutputOwners(addrs, locktime, 1));
            let op1:NFTMintOperation = new NFTMintOperation(1, payload, outputOwners);
            let op2:NFTMintOperation = new NFTMintOperation(2, payload, outputOwners);
            let op3:NFTMintOperation = new NFTMintOperation(0, payload, outputOwners);
            let cmp = NFTMintOperation.comparator();
            expect(cmp(op1, op1)).toBe(0);
            expect(cmp(op2, op2)).toBe(0);
            expect(cmp(op3, op3)).toBe(0);
            expect(cmp(op1, op2)).toBe(-1);
            expect(cmp(op1, op3)).toBe(1);
        });

        test('Functionality', () => {
            let outputOwners:Array<OutputOwners> = [];
            outputOwners.push(new OutputOwners(addrs, locktime, 1));
            let op:NFTMintOperation = new NFTMintOperation(0, payload, outputOwners);
        
            expect(op.getOperationID()).toBe(AVMConstants.NFTMINTOPID);
            expect(op.getOutputOwners().toString()).toBe(outputOwners.toString());
        
            let opcopy:NFTMintOperation = new NFTMintOperation();
            let opb:Buffer = op.toBuffer();
            opcopy.fromBuffer(opb);
            expect(opcopy.toString()).toBe(op.toString());
        });

        test("NFTMintOperation codecIDs", (): void => {
          const outputOwners: OutputOwners[] = [];
          outputOwners.push(new OutputOwners(addrs, locktime, 1));
          const nftMintOperation: NFTMintOperation = new NFTMintOperation(0, payload, outputOwners);
          expect(nftMintOperation.getCodecID()).toBe(codecID_zero);
          expect(nftMintOperation.getOperationID()).toBe(AVMConstants.NFTMINTOPID);
          nftMintOperation.setCodecID(codecID_one)
          expect(nftMintOperation.getCodecID()).toBe(codecID_one);
          expect(nftMintOperation.getOperationID()).toBe(AVMConstants.NFTMINTOPID_CODECONE);
          nftMintOperation.setCodecID(codecID_zero)
          expect(nftMintOperation.getCodecID()).toBe(codecID_zero);
          expect(nftMintOperation.getOperationID()).toBe(AVMConstants.NFTMINTOPID);
        });

        test("Invalid NFTMintOperation codecID", (): void => {
          const outputOwners: OutputOwners[] = [];
          outputOwners.push(new OutputOwners(addrs, locktime, 1));
          const nftMintOperation: NFTMintOperation = new NFTMintOperation(0, payload, outputOwners);
          expect(() => {
            nftMintOperation.setCodecID(2)
          }).toThrow("Error - NFTMintOperation.setCodecID: codecID 2, is not valid. Valid codecIDs are 0 and 1.");
        });
    })

    describe('NFTTransferOperation', () => {
        test('SelectOperationClass', () => {
            let nout:NFTTransferOutput = new NFTTransferOutput(1000, payload, addrs, locktime, 1);
            let goodop:NFTTransferOperation = new NFTTransferOperation(nout);
            let operation:Operation = SelectOperationClass(goodop.getOperationID());
            expect(operation).toBeInstanceOf(NFTTransferOperation);
            expect(() => {
                SelectOperationClass(99);
            }).toThrow("Error - SelectOperationClass: unknown opid");
        });

        test('comparator', () => {
            let op1:NFTTransferOperation = new NFTTransferOperation(new NFTTransferOutput(1000, payload, addrs, locktime, 1));
            let op2:NFTTransferOperation = new NFTTransferOperation(new NFTTransferOutput(1001, payload, addrs, locktime, 1));
            let op3:NFTTransferOperation = new NFTTransferOperation(new NFTTransferOutput(999, payload, addrs, locktime, 1));
            let cmp = NFTTransferOperation.comparator();
            expect(cmp(op1, op1)).toBe(0);
            expect(cmp(op2, op2)).toBe(0);
            expect(cmp(op3, op3)).toBe(0);
            expect(cmp(op1, op2)).toBe(-1);
            expect(cmp(op1, op3)).toBe(1);
        });

        test('Functionality', () => {
            let nout:NFTTransferOutput = new NFTTransferOutput(1000, payload, addrs, locktime, 1);
            let op:NFTTransferOperation = new NFTTransferOperation(nout);
        
            expect(op.getOperationID()).toBe(AVMConstants.NFTXFEROPID);
            expect(op.getOutput().toString()).toBe(nout.toString());
        
            let opcopy:NFTTransferOperation = new NFTTransferOperation();
            opcopy.fromBuffer(op.toBuffer());
            expect(opcopy.toString()).toBe(op.toString());
        
            op.addSignatureIdx(0, addrs[0]);
            let sigidx:Array<SigIdx> = op.getSigIdxs();
            expect(sigidx[0].getSource().toString("hex")).toBe(addrs[0].toString("hex"));
            opcopy.fromBuffer(op.toBuffer());
            expect(opcopy.toString()).toBe(op.toString());
        });

        test("NFTTransferOperation codecIDs", (): void => {
          const nftTransferOperation: NFTTransferOperation = new NFTTransferOperation(new NFTTransferOutput(1000, payload, addrs, locktime, 1));
          expect(nftTransferOperation.getCodecID()).toBe(codecID_zero);
          expect(nftTransferOperation.getOperationID()).toBe(AVMConstants.NFTXFEROPID);
          nftTransferOperation.setCodecID(codecID_one)
          expect(nftTransferOperation.getCodecID()).toBe(codecID_one);
          expect(nftTransferOperation.getOperationID()).toBe(AVMConstants.NFTXFEROPID_CODECONE);
          nftTransferOperation.setCodecID(codecID_zero)
          expect(nftTransferOperation.getCodecID()).toBe(codecID_zero);
          expect(nftTransferOperation.getOperationID()).toBe(AVMConstants.NFTXFEROPID);
        });

        test("Invalid NFTTransferOperation codecID", (): void => {
          const nftTransferOperation: NFTTransferOperation = new NFTTransferOperation(new NFTTransferOutput(1000, payload, addrs, locktime, 1));
          expect(() => {
            nftTransferOperation.setCodecID(2)
          }).toThrow("Error - NFTTransferOperation.setCodecID: codecID 2, is not valid. Valid codecIDs are 0 and 1.");
        });
    })


    test('TransferableOperation', () => {
        let nout:NFTTransferOutput = new NFTTransferOutput(1000, payload, addrs, locktime, 1);
        let op:NFTTransferOperation = new NFTTransferOperation(nout);
        let nfttxid:Buffer = Buffer.from(createHash("sha256").update(bintools.fromBNToBuffer(new BN(1000), 32)).digest());
        let nftoutputidx:Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(1000), 4));
        let nftutxo:UTXO = new UTXO(AVMConstants.LATESTCODEC, nfttxid, nftoutputidx, assetIDBuff, nout);
        let xferop:TransferableOperation = new TransferableOperation(assetIDBuff, [nftutxo.getUTXOID()], op);

        let xferop2:TransferableOperation = new TransferableOperation(assetIDBuff, [Buffer.concat([nfttxid, nftoutputidx])], op); 
        let uid:UTXOID = new UTXOID();
        uid.fromString(nftutxo.getUTXOID());
        let xferop3:TransferableOperation = new TransferableOperation(assetIDBuff, [uid], op);

        expect(xferop.getAssetID().toString("hex")).toBe(assetID);
        let utxoiddeserialized:Buffer = bintools.cb58Decode(xferop.getUTXOIDs()[0].toString());
        expect(bintools.bufferToB58(utxoiddeserialized)).toBe(nftutxo.getUTXOID());
        expect(xferop.getOperation().toString()).toBe(op.toString());

        let opcopy:TransferableOperation = new TransferableOperation();
        opcopy.fromBuffer(xferop.toBuffer());
        expect(opcopy.toString()).toBe(xferop.toString());

        expect(xferop2.toBuffer().toString("hex")).toBe(xferop.toBuffer().toString('hex'));
        expect(xferop3.toBuffer().toString("hex")).toBe(xferop.toBuffer().toString('hex'));
    });

});