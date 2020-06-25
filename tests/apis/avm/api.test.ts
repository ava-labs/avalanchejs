import mockAxios from 'jest-mock-axios';
import { Avalanche } from "src";
import AVMAPI, { PersistanceOptions, MinterSet, MappedMinterSet } from "src/apis/avm/api";
import { AVMKeyPair, AVMKeyChain } from 'src/apis/avm/keychain';
import {Buffer} from "buffer/";
import BN from "bn.js";
import BinTools from 'src/utils/bintools';
import { UTXOSet, UTXO } from 'src/apis/avm/utxos';
import { TransferableInput, SecpInput } from 'src/apis/avm/inputs';
import createHash from "create-hash";
import { UnsignedTx, Tx } from 'src/apis/avm/tx';
import { UnixNow, AVMConstants, InitialStates } from 'src/apis/avm/types';
import { TransferableOutput, SecpOutput, NFTMintOutput, OutputOwners } from 'src/apis/avm/outputs';
import { NFTTransferOutput } from '../../../src/apis/avm/outputs';
import { NFTTransferOperation, TransferableOperation } from '../../../src/apis/avm/ops';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

describe("AVMAPI", () => {
    const networkid:number = 12345;
    const blockchainid:string = "4R5p2RXDGLqaifZE4hHWH9owe34pfoBULn1DrQTWivjg8o4aH";
    const ip:string = '127.0.0.1';
    const port:number = 9650;
    const protocol:string = "https";

    let username:string = 'AvaLabs';
    let password:string = 'password';

    let avalanche:Avalanche = new Avalanche(ip,port,protocol, networkid, undefined, true);
    let api:AVMAPI;
    let alias:string;

    const addrA:string = "X-B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW";
    const addrB:string = "X-P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF";
    const addrC:string = "X-6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV";

    beforeAll(() => {
        api = new AVMAPI(avalanche, "/ext/bc/avm", blockchainid);
        alias = api.getBlockchainAlias();
    });

    afterEach(() => {
        mockAxios.reset();
    });

    test('can Send 1', async ()=>{
        let txId = 'asdfhvl234';

        let result:Promise<string> = api.send(username, password, 'assetId', 10, addrA, [addrB]);
        let payload:object = {
            "result": {
                'txID': txId
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(txId);
    });

    test('can Send 2', async ()=>{
        let txId = 'asdfhvl234';

        let result:Promise<string> = api.send(username, password, bintools.b58ToBuffer("6h2s5de1VC65meajE1L2PjvZ1MXvHc3F6eqPCGKuDt4MxiweF"), new BN(10), addrA, [addrB]);
        let payload:object = {
            "result": {
                'txID': txId
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(txId);
    });

    test('listAddresses', async ()=>{
        let addresses = [addrA,addrB];

        let result:Promise<Array<string>> = api.listAddresses(username, password);
        let payload:object = {
            "result": {
                'addresses': addresses
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(addresses);
    });

    test('importKey', async ()=>{
        let address = addrC;

        let result:Promise<string> = api.importKey(username, password, 'key');
        let payload:object = {
            "result": {
                'address': address
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(address);
    });

    test('getBalance', async ()=>{
        let balance = new BN("100", 10);

        let result:Promise<BN> = api.getBalance(addrA, 'ATH');
        let payload:object = {
            "result": {
                "balance": balance
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:BN = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(balance);
    });

    test('exportKey', async ()=>{
        let key = 'sdfglvlj2h3v45';

        let result:Promise<string> = api.exportKey(username, password, addrA);
        let payload:object = {
            "result": {
                "privateKey": key
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(key);
    });

    test("exportAVA", async ()=>{
        let amount = new BN(100);
        let to = "abcdef";
        let username = "Robert";
        let password = "Paulson";
        let txID = "valid";
        let result:Promise<string> = api.exportAVA(username, password, to, amount);
        let payload:object = {
            "result": {
                "txID": txID
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(txID);
    });

    test("importAVA", async ()=>{
        let to = "abcdef";
        let username = "Robert";
        let password = "Paulson";
        let txID = "valid";
        let result:Promise<string> = api.importAVA(username, password, to);
        let payload:object = {
            "result": {
                "txID": txID
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(txID);
    });

    test('createAddress', async ()=>{
        let alias = 'randomalias';

        let result:Promise<string> = api.createAddress(username, password);
        let payload:object = {
            "result": {
                "address": alias
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(alias);
    });

    test('createFixedCapAsset', async ()=>{
        let kp:AVMKeyPair = new AVMKeyPair(alias);
        kp.importKey(Buffer.from("ef9bf2d4436491c153967c9709dd8e82795bdb9b5ad44ee22c2903005d1cf676", "hex"));
        
        let denomination:number = 0
        let assetid:string = "8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533";
        let initialHolders:Array<object> = [
            {
                "address": "7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh",
                "amount": "10000"
            },
            {
                "address": "7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh",
                "amount": "50000"
            }
        ]

        let result:Promise<string> = api.createFixedCapAsset(username, password, "Some Coin", "SCC", denomination, initialHolders);
        let payload:object = {
            "result": {
                'assetID': assetid
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(assetid);
    });

    test('createVariableCapAsset', async ()=>{
        let kp:AVMKeyPair = new AVMKeyPair(alias);
        kp.importKey(Buffer.from("ef9bf2d4436491c153967c9709dd8e82795bdb9b5ad44ee22c2903005d1cf676", "hex"));

        let denomination:number = 0;
        let assetid:string = "8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533";
        let minterSets:Array<object> = [
            {
                "minters":[
                    "4peJsFvhdn7XjhNF4HWAQy6YaJts27s9q"
                ],
                "threshold": 1
            },
            {
                "minters": [
                    "dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF",
                    "2fE6iibqfERz5wenXE6qyvinsxDvFhHZk",
                    "7ieAJbfrGQbpNZRAQEpZCC1Gs1z5gz4HU"
                ],
                "threshold": 2
            }
        ]

        let result:Promise<string> = api.createVariableCapAsset(username, password, "Some Coin", "SCC", denomination, minterSets);
        let payload:object = {
            "result": {
                'assetID': assetid
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(assetid);
    });

    test('createMintTx 1', async ()=>{
        let amount:number = 2;
        let assetID:string = "f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7";
        let to:string = "dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF";
        let minters:Array<string> = [
            "dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF",
            "2fE6iibqfERz5wenXE6qyvinsxDvFhHZk",
            "7ieAJbfrGQbpNZRAQEpZCC1Gs1z5gz4HU"
        ]
        let result:Promise<string> = api.createMintTx(amount, assetID, to, minters);
        let payload:object = {
            "result": {
                'tx': "sometx"
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe("sometx");
    });

    test('createMintTx 2', async ()=>{
        let amount:BN = new BN(1);
        let assetID:Buffer = Buffer.from("f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7", "hex");
        let to:string = "dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF";
        let minters:Array<string> = [
            "dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF",
            "2fE6iibqfERz5wenXE6qyvinsxDvFhHZk",
            "7ieAJbfrGQbpNZRAQEpZCC1Gs1z5gz4HU"
        ]
        let result:Promise<string> = api.createMintTx(amount, assetID, to, minters);
        let payload:object = {
            "result": {
                'tx': "sometx"
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe("sometx");
    });

    test('signMintTx 1', async ()=>{
        let username:string = "Collin";
        let password:string = "Cusce";
        let tx:string = "f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7";
        let minter:string = addrA;
        let result:Promise<string> = api.signMintTx(username, password, tx, minter);
        let payload:object = {
            "result": {
                'tx': "sometx"
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe("sometx");
    });

    test('signMintTx 2', async ()=>{
        let username:string = "Collin";
        let password:string = "Cusce";
        let tx:Buffer = Buffer.from("f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7", "hex");
        let minter:string = addrA;
        let result:Promise<string> = api.signMintTx(username, password, tx, minter);
        let payload:object = {
            "result": {
                'tx': "sometx"
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe("sometx");
    });

    test('getTxStatus', async ()=>{
        let txid:string = "f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7";

        let result:Promise<string> = api.getTxStatus(txid);
        let payload:object = {
            "result": {
                'status': "accepted"
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe("accepted");
    });


    test('getAssetDescription as string', async ()=>{
        let assetid:Buffer = Buffer.from("8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533", 'hex');
        let assetidstr:string = bintools.avaSerialize(assetid);

        let result:Promise<object> = api.getAssetDescription(assetidstr);
        let payload:object = {
            "result": {
                'name': "Collin Coin",
                'symbol': 'CKC',
                'assetID': assetidstr,
                'denomination': '10'
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:object = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response["name"]).toBe("Collin Coin");
        expect(response["symbol"]).toBe("CKC");
        expect(response["assetID"].toString("hex")).toBe(assetid.toString("hex"));
        expect(response["denomination"]).toBe(10);
    });

    test('getAssetDescription as Buffer', async ()=>{
        let assetid:Buffer = Buffer.from("8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533", 'hex');
        let assetidstr:string = bintools.avaSerialize(Buffer.from('8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533', 'hex'));

        let result:Promise<object> = api.getAssetDescription(assetid);
        let payload:object = {
            "result": {
                'name': "Collin Coin",
                'symbol': 'CKC',
                'assetID': assetidstr,
                'denomination': '11'
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:object = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response["name"]).toBe("Collin Coin");
        expect(response["symbol"]).toBe("CKC");
        expect(response["assetID"].toString("hex")).toBe(assetid.toString("hex"));
        expect(response["denomination"]).toBe(11);
    });

    test('getUTXOs', async ()=>{
        //Payment
        let OPUTXOstr1:string = bintools.avaSerialize(Buffer.from("38d1b9f1138672da6fb6c35125539276a9acc2a668d63bea6ba3c795e2edb0f5000000013e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd3558000000070000000000004dd500000000000000000000000100000001a36fd0c2dbcab311731dde7ef1514bd26fcdc74d", "hex"));
        let OPUTXOstr2:string = bintools.avaSerialize(Buffer.from("c3e4823571587fe2bdfc502689f5a8238b9d0ea7f3277124d16af9de0d2d9911000000003e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd355800000007000000000000001900000000000000000000000100000001e1b6b6a4bad94d2e3f20730379b9bcd6f176318e", "hex"));
        let OPUTXOstr3:string = bintools.avaSerialize(Buffer.from("f29dba61fda8d57a911e7f8810f935bde810d3f8d495404685bdb8d9d8545e86000000003e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd355800000007000000000000001900000000000000000000000100000001e1b6b6a4bad94d2e3f20730379b9bcd6f176318e", "hex"));

        let set:UTXOSet = new UTXOSet();
        set.add(OPUTXOstr1);
        set.addArray([OPUTXOstr2, OPUTXOstr3]);

        let persistOpts:PersistanceOptions = new PersistanceOptions("test", true, "union");
        expect(persistOpts.getMergeRule()).toBe("union");
        let addresses:Array<string> = set.getAddresses().map(a => api.addressFromBuffer(a));
        let result:Promise<UTXOSet> = api.getUTXOs(addresses, persistOpts);
        let payload:object = {
            "result": {
                'utxos': [OPUTXOstr1, OPUTXOstr2, OPUTXOstr3]
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:UTXOSet = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(JSON.stringify(response.getAllUTXOStrings().sort())).toBe(JSON.stringify(set.getAllUTXOStrings().sort()));

        addresses = set.getAddresses().map(a => api.addressFromBuffer(a));
        result = api.getUTXOs(addresses, persistOpts);
        

        mockAxios.mockResponse(responseObj);
        response = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(2);
        expect(JSON.stringify(response.getAllUTXOStrings().sort())).toBe(JSON.stringify(set.getAllUTXOStrings().sort()));
    });

    describe('Transactions', () => {
        let set:UTXOSet;
        let keymgr2:AVMKeyChain;
        let keymgr3:AVMKeyChain;
        let addrs1:Array<string>;
        let addrs2:Array<string>;
        let addrs3:Array<string>;
        let addressbuffs:Array<Buffer>;
        let addresses:Array<string>;
        let utxos:Array<UTXO>;
        let inputs:Array<TransferableInput>;
        let outputs:Array<TransferableOutput>;
        let ops:Array<TransferableOperation>;
        const amnt:number = 10000;
        let assetID:Buffer = Buffer.from(createHash("sha256").update("mary had a little lamb").digest());
        let NFTassetID:Buffer = Buffer.from(createHash("sha256").update("I can't stand it, I know you planned it, I'mma set straight this Watergate.'").digest());
        let secpbase1:SecpOutput;
        let secpbase2:SecpOutput;
        let secpbase3:SecpOutput;
        let nftpbase1:NFTMintOutput;
        let nftpbase2:NFTMintOutput;
        let nftpbase3:NFTMintOutput;
        let initialState:InitialStates;
        let nftInitialState:InitialStates;
        let nftutxoids:Array<string>;
        
        beforeEach(() => {
            set = new UTXOSet();
            api.newKeyChain()
            keymgr2 = new AVMKeyChain(alias);
            keymgr3 = new AVMKeyChain(alias);
            addrs1 = [];
            addrs2 = [];
            addrs3 = [];
            addressbuffs = [];
            addresses = [];
            nftutxoids = [];
            utxos = [];
            inputs = [];
            outputs = [];
            ops = [];
            let pload:Buffer = Buffer.alloc(1024);
            pload.write("All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.", 0, 1024, "utf8" );

            for(let i:number = 0; i < 3; i++){
                addrs1.push(api.addressFromBuffer(api.keyChain().makeKey()));
                addrs2.push(api.addressFromBuffer(keymgr2.makeKey()));
                addrs3.push(api.addressFromBuffer(keymgr3.makeKey()));
            }
            let amount:BN = new BN(amnt);
            addressbuffs = api.keyChain().getAddresses();
            addresses = addressbuffs.map(a => api.addressFromBuffer(a));
            let fallAddresses:Array<string> = keymgr2.getAddresses().map(a => api.addressFromBuffer(a));
            let locktime:BN = new BN(54321);
            let fallLocktime:BN = locktime.add(new BN(50));
            let threshold:number = 3;
            let fallThreshold:number = 1;
            
            for(let i:number = 0; i < 5; i++){
                let txid:Buffer = Buffer.from(createHash("sha256").update(bintools.fromBNToBuffer(new BN(i), 32)).digest());
                let txidx:Buffer = Buffer.alloc(4);
                txidx.writeUInt32BE(i, 0)
                let out:SecpOutput = new SecpOutput(amount, locktime, threshold, addressbuffs);
                let xferout:TransferableOutput = new TransferableOutput(assetID, out);
                outputs.push(xferout);
    
                let u:UTXO = new UTXO();
                u.fromBuffer(Buffer.concat([txid, txidx, xferout.toBuffer()]));
                utxos.push(u);
    
                txid = u.getTxID();
                txidx = u.getOutputIdx();
                let asset = u.getAssetID();
    
                let input:SecpInput = new SecpInput(amount);
                let xferinput:TransferableInput = new TransferableInput(txid, txidx, asset, input);
                inputs.push(xferinput);

                let nout:NFTTransferOutput = new NFTTransferOutput(1000 + i, pload, locktime, threshold, addressbuffs);
                let op:NFTTransferOperation = new NFTTransferOperation(nout);
                let nfttxid:Buffer = Buffer.from(createHash("sha256").update(bintools.fromBNToBuffer(new BN(1000 + i), 32)).digest());
                let nftutxo:UTXO = new UTXO(nfttxid, 1000 + i, NFTassetID, nout);
                nftutxoids.push(nftutxo.getUTXOID());
                let xferop:TransferableOperation = new TransferableOperation(NFTassetID, [nftutxo.getUTXOID()], op);
                ops.push(xferop);
                utxos.push(nftutxo);
            }
            set.addArray(utxos);

            secpbase1 = new SecpOutput(new BN(777), UnixNow(), 1, addrs3.map(a => api.parseAddress(a)));
            secpbase2 = new SecpOutput(new BN(888), UnixNow(), 1, addrs2.map(a => api.parseAddress(a)));
            secpbase3 = new SecpOutput(new BN(999), UnixNow(), 1, addrs2.map(a => api.parseAddress(a)));
            initialState = new InitialStates();
            initialState.addOutput(secpbase1, AVMConstants.SECPFXID);
            initialState.addOutput(secpbase2, AVMConstants.SECPFXID);
            initialState.addOutput(secpbase3, AVMConstants.SECPFXID);

            nftpbase1 = new NFTMintOutput(0, locktime, 1, addrs1.map(a => api.parseAddress(a)));
            nftpbase2 = new NFTMintOutput(1, locktime, 1, addrs2.map(a => api.parseAddress(a)));
            nftpbase3 = new NFTMintOutput(2, locktime, 1, addrs3.map(a => api.parseAddress(a)));
            nftInitialState = new InitialStates();
            nftInitialState.addOutput(nftpbase1, AVMConstants.NFTFXID);
            nftInitialState.addOutput(nftpbase2, AVMConstants.NFTFXID);
            nftInitialState.addOutput(nftpbase3, AVMConstants.NFTFXID);
        });

        test('buildBaseTx1', async () => {
    
            let txu1:UnsignedTx = await api.buildBaseTx(set, new BN(amnt), addrs3, addrs1, addrs1, bintools.avaSerialize(assetID));
            let txu2:UnsignedTx = set.buildBaseTx(
                networkid, bintools.avaDeserialize(blockchainid), new BN(amnt), 
                addrs3.map(a => api.parseAddress(a)), 
                addrs1.map(a => api.parseAddress(a)), 
                addrs1.map(a => api.parseAddress(a)), 
                assetID, UnixNow(), new BN(0), 1
            );
            
            expect(txu2.toBuffer().toString("hex")).toBe(txu1.toBuffer().toString("hex"));
            expect(txu2.toString()).toBe(txu1.toString());
            
        });

        test('buildBaseTx2', async () => {
            let txu1:UnsignedTx = await api.buildBaseTx(set, new BN(amnt).sub(new BN(100)), addrs3, addrs1, addrs2, bintools.avaSerialize(assetID));
            let txu2:UnsignedTx = set.buildBaseTx(
                networkid, bintools.avaDeserialize(blockchainid), new BN(amnt).sub(new BN(100)), 
                addrs3.map(a => api.parseAddress(a)), 
                addrs1.map(a => api.parseAddress(a)), 
                addrs2.map(a => api.parseAddress(a)), 
                assetID, UnixNow(), new BN(0), 1
            );
            
            expect(txu2.toBuffer().toString("hex")).toBe(txu1.toBuffer().toString("hex"));
            expect(txu2.toString()).toBe(txu1.toString());
            
            let outies = txu1.getTransaction().getOuts().sort(TransferableOutput.comparator()) as Array<TransferableOutput>;

            expect(outies.length).toBe(2);
            let outaddr0 = outies[0].getOutput().getAddresses().map(a => api.addressFromBuffer(a));
            let outaddr1 = outies[1].getOutput().getAddresses().map(a => api.addressFromBuffer(a));

            let testaddr2 = JSON.stringify(addrs2.sort());
            let testaddr3 = JSON.stringify(addrs3.sort());

            let testout0 = JSON.stringify(outaddr0.sort());
            let testout1 = JSON.stringify(outaddr1.sort());
            expect(
                (testaddr2 == testout0 && testaddr3 == testout1)
                ||
                (testaddr3 == testout0 && testaddr2 == testout1)).toBe(true);
        });

        test('signTx', async () => {
            let txu1:UnsignedTx = await api.buildBaseTx(set, new BN(amnt), addrs3, addrs1, addrs1, bintools.avaSerialize(assetID));
            let txu2:UnsignedTx = set.buildBaseTx(
                networkid, bintools.avaDeserialize(blockchainid), new BN(amnt), 
                addrs3.map(a => api.parseAddress(a)), 
                addrs1.map(a => api.parseAddress(a)), 
                addrs1.map(a => api.parseAddress(a)), 
                assetID, UnixNow(), new BN(0), 1
            );
            
            let tx1:Tx = api.signTx(txu1);
            let tx2:Tx = api.signTx(txu2);

            expect(tx2.toBuffer().toString("hex")).toBe(tx1.toBuffer().toString("hex"));
            expect(tx2.toString()).toBe(tx1.toString());
            
        });

        test('issueTx Serialized', async ()=>{
            let txu:UnsignedTx = await api.buildBaseTx(set, new BN(amnt), addrs3, addrs1, addrs1, bintools.avaSerialize(assetID));
            let tx = api.signTx(txu);

            let txid:string = "f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7";

            let result:Promise<string> = api.issueTx(tx.toString());
            let payload:object = {
                "result": {
                    'txID': txid
                }
            };
            let responseObj = {
                data: payload
            };
    
            mockAxios.mockResponse(responseObj);
            let response:string = await result;
    
            expect(mockAxios.request).toHaveBeenCalledTimes(1);
            expect(response).toBe(txid);
        });

        test('issueTx Buffer', async ()=>{
            let txu:UnsignedTx = await api.buildBaseTx(set, new BN(amnt), addrs3, addrs1, addrs1, bintools.avaSerialize(assetID));
            let tx = api.signTx(txu);

            let txid:string = "f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7";
            let result:Promise<string> = api.issueTx(tx.toBuffer());
            let payload:object = {
                "result": {
                    'txID': txid
                }
            };
            let responseObj = {
                data: payload
            };
    
            mockAxios.mockResponse(responseObj);
            let response:string = await result;
    
            expect(mockAxios.request).toHaveBeenCalledTimes(1);
            expect(response).toBe(txid);
        });

        test('issueTx Class Tx', async ()=>{
            let txu:UnsignedTx = await api.buildBaseTx(set, new BN(amnt), addrs3, addrs1, addrs1, bintools.avaSerialize(assetID));
            let tx = api.signTx(txu);

            let txid:string = "f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7";
    
            let result:Promise<string> = api.issueTx(tx);
            let payload:object = {
                "result": {
                    'txID': txid
                }
            };
            let responseObj = {
                data: payload
            };
    
            mockAxios.mockResponse(responseObj);
            let response:string = await result;
    
            expect(mockAxios.request).toHaveBeenCalledTimes(1);
            expect(response).toBe(txid);
        });

        test('buildCreateAssetTx', async () => {
            let fee:number = 10;
            let name:string = "Mortycoin is the dumb as a sack of hammers.";
            let symbol:string = "morT";
            let denomination:number = 8;

            let result:Promise<UnsignedTx> = api.buildCreateAssetTx(set, new BN(fee), addrs1, initialState, name, symbol, denomination);
            let payload:object = {
                "result": {
                    'name': name, 
                    'symbol': symbol, 
                    'assetID': bintools.avaSerialize(assetID), 
                    'denomination': "" + denomination
                }
            };
            let responseObj = {
                data: payload
            };
    
            mockAxios.mockResponse(responseObj);
            let txu1:UnsignedTx = await result;
    
            expect(mockAxios.request).toHaveBeenCalledTimes(1);
            
            let txu2:UnsignedTx = set.buildCreateAssetTx(avalanche.getNetworkID(), bintools.avaDeserialize(api.getBlockchainID()), assetID, new BN(fee), addrs1.map(a => api.parseAddress(a)), initialState, name, symbol, denomination);
            
            expect(txu1.fromBuffer(txu2.toBuffer())).toBe(txu2.fromBuffer(txu1.toBuffer()));
            expect(txu2.toBuffer().toString("hex")).toBe(txu1.toBuffer().toString("hex"));
            expect(txu2.toString()).toBe(txu1.toString());
            
        });

        test('buildCreateNFTAssetTx', async () => {
            let fee:number = 0;
            let name:string = "Coincert";
            let symbol:string = "TIXX";
            let minterSets:Array<MinterSet> = [{minters:addrs1,threshold:1}];
            let locktime:BN = new BN(0);
            let addrbuff1: Buffer[] = addrs1.map(a => api.parseAddress(a));

            let txu1:UnsignedTx = await api.buildCreateNFTAssetTx(
                set, new BN(fee), addrs1, nftInitialState, 
                name, symbol, minterSets, locktime
            );
            
            let mappedMinterSets:Array<MappedMinterSet> = [{ threshold: 1, minters: addrbuff1 }];
            let txu2:UnsignedTx = set.buildCreateNFTAssetTx(avalanche.getNetworkID(), bintools.avaDeserialize(api.getBlockchainID()), assetID, new BN(fee), addrs1.map(a => api.parseAddress(a)), nftInitialState, mappedMinterSets, name, symbol, locktime);

            expect(txu2.toBuffer().toString("hex")).toBe(txu1.toBuffer().toString("hex"));
            expect(txu2.toString()).toBe(txu1.toString());
        });

        test('buildCreateNFTMintTx', async () => {
            let fee:number = 0;
            let groupID:number = 0;
            let locktime:BN = new BN(0);
            let threshold:number = 1;
            let bytestring:Buffer = undefined;
            let svg:Buffer = undefined;
            let url:string = "https://example.com";
            let addrbuff1: Buffer[] = addrs1.map(a => api.parseAddress(a));
            let addrbuff3: Buffer[] = addrs3.map(a => api.parseAddress(a));
            let outputOwners:Array<OutputOwners> = [];
            outputOwners.push(new OutputOwners(locktime, threshold, addrbuff3));

            let txu1:UnsignedTx = await api.buildCreateNFTMintTx(
                set, nftutxoids, outputOwners, addrs3, new BN(fee), addrs1,
                UnixNow(), groupID, bytestring, svg, url
            );
    
            let txu2:UnsignedTx = set.buildCreateNFTMintTx(
                avalanche.getNetworkID(), bintools.avaDeserialize(api.getBlockchainID()), 
                assetID, new BN(fee), addrbuff1, outputOwners, addrbuff3, nftutxoids, UnixNow(), 
                groupID, bytestring, svg, url
            );

            expect(txu2.toBuffer().toString("hex")).toBe(txu1.toBuffer().toString("hex"));
            expect(txu2.toString()).toBe(txu1.toString());
        });

        test('buildNFTTransferTx', async () => {
            let pload:Buffer = Buffer.alloc(1024);
            pload.write("All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.", 0, 1024, "utf8" );
            let addrbuff1 = addrs1.map(a => api.parseAddress(a));
            let addrbuff3 = addrs3.map(a => api.parseAddress(a));
            let fee:BN = new BN(90);
            let txu1:UnsignedTx = await api.buildNFTTransferTx(
                set, nftutxoids[1], addrs3, addrs3, fee, addrs1,
                UnixNow(), new BN(0), 1
            );
           
            let txu2:UnsignedTx = set.buildNFTTransferTx(
                networkid, bintools.avaDeserialize(blockchainid), assetID,
                fee, addrbuff1, addrbuff3, addrbuff3, 
                [nftutxoids[1]], UnixNow(), new BN(0), 1
            )

            expect(txu2.toBuffer().toString("hex")).toBe(txu1.toBuffer().toString("hex"));
            expect(txu2.toString()).toBe(txu1.toString());
            
        });
    });

    test('buildGenesis', async ()=>{
        let genesisData:object = {
            genesisData : {
                assetAlias1: {
                    name: "human readable name",
                    symbol: "AVAL",
                    initialState: {
                        fixedCap : [
                            {
                                amount: 1000,
                                address: "A"
                            },
                            {
                                amount: 5000,
                                address: "B"
                            },
                        ]
                    }
                },
                assetAliasCanBeAnythingUnique: {
                    name: "human readable name",
                    symbol: "AVAL",
                    initialState: {
                        variableCap : [
                            {
                                minters: [
                                    "A",
                                    "B"
                                ],
                                threshold: 1
                            },
                            {
                                minters: [
                                    "A",
                                    "B",
                                    "C"
                                ],
                                threshold: 2
                            }
                        ]
                    }
                }
            }
        }
        let bytes:string = "111TNWzUtHKoSvxohjyfEwE2X228ZDGBngZ4mdMUVMnVnjtnawW1b1zbAhzyAM1v6d7ECNj6DXsT7qDmhSEf3DWgXRj7ECwBX36ZXFc9tWVB2qHURoUfdDvFsBeSRqatCmj76eZQMGZDgBFRNijRhPNKUap7bCeKpHDtuCZc4YpPkd4mR84dLL2AL1b4K46eirWKMaFVjA5btYS4DnyUx5cLpAq3d35kEdNdU5zH3rTU18S4TxYV8voMPcLCTZ3h4zRsM5jW1cUzjWVvKg7uYS2oR9qXRFcgy1gwNTFZGstySuvSF7MZeZF4zSdNgC4rbY9H94RVhqe8rW7MXqMSZB6vBTB2BpgF6tNFehmYxEXwjaKRrimX91utvZe9YjgGbDr8XHsXCnXXg4ZDCjapCy4HmmRUtUoAduGNBdGVMiwE9WvVbpMFFcNfgDXGz9NiatgSnkxQALTHvGXXm8bn4CoLFzKnAtq3KwiWqHmV3GjFYeUm3m8Zee9VDfZAvDsha51acxfto1htstxYu66DWpT36YT18WSbxibZcKXa7gZrrsCwyzid8CCWw79DbaLCUiq9u47VqofG1kgxwuuyHb8NVnTgRTkQASSbj232fyG7YeX4mAvZY7a7K7yfSyzJaXdUdR7aLeCdLP6mbFDqUMrN6YEkU2X8d4Ck3T"

        let result:Promise<string> = api.buildGenesis(genesisData);
        let payload:object = {
            "result": {
                'bytes': bytes
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(bytes);
    });
    

});