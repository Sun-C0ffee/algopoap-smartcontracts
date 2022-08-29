// A cave man simple deployer to mend the progress with rapid deployment of AlgoPoaP contracts

const algosdk = require('algosdk');
const fs = require('fs')
const path = require('path');
const fetch = require('node-fetch');
const logger = require('./logger');
const config = require('./config.json');
const mode = config.deployer.mode
const appExists = true
let accountExists = false;

// Global scope variables
let algodToken;
let algodPort;
let algodServer;
let indexerPort;

let applicationAddr = config.algorand.asc_main_address;
let applicationId = config.algorand.asc_main_id;
let applicationItemId = config.deployer.test_item_update_app;
let accountObject;
let accountAddress;
let accountBalance;

let assetsHeld;
let assetsCreated;
let appsCreated;
let assetsHeldBalance;
let assetsCreatedBalance;


let trxPayment;
let trxTransfer;

algodServer = config.algorand.algod_remote_server;
algodToken = config.algorand.algod_remote_token;
algodPort = config.algorand.algod_remote_port

let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

indexerServer = config.algorand.indexer_remote_server;
algodToken = config.algorand.indexer_remote_token;
indexerPort = config.algorand.indexer_remote_port
let indexerClient = new algosdk.Indexer(algodToken, indexerServer, indexerPort);

const mnemonic = path.join(__dirname, 'algopoap_mnemonic.txt');
const testMnemonic = path.join(__dirname, 'test_mnemonic.txt');
const accountMnemonic = fs.readFileSync(mnemonic, 'utf8');



const importAccount = function () {
    try {
        const acc = algosdk.mnemonicToSecretKey(accountMnemonic);
        accountAddress = acc.addr
        logger.info("Account Address = %s", acc.addr);
        let acc_mnemonic_check = algosdk.secretKeyToMnemonic(acc.sk);

        let acc_decoded = algosdk.decodeAddress(acc.addr);
        logger.info("Account Address Decoded Public Key = %s", acc_decoded.publicKey.toString());
        logger.info("Account Address Decoded Checksum = %s", acc_decoded.checksum.toString());
        let acc_encoded = algosdk.encodeAddress(acc_decoded.publicKey);
        logger.info("Account Address Encoded = %s", acc_encoded);


        logger.warn(config.algorand['algo_dispencer'] + acc.addr);
        return acc;
    }
    catch (err) {
        logger.error(err);
    }
};

async function waitForConfirmation(txId) {
    logger.info("waiting for transaction: %s", txId)
    let response = await algodClient.status().do();
    let lastround = response["last-round"];
    while (true) {
        const pendingInfo = await algodClient
            .pendingTransactionInformation(txId)
            .do();
        if (
            pendingInfo["confirmed-round"] !== null &&
            pendingInfo["confirmed-round"] > 0
        ) {
            logger.info(
                "Transaction %s  confirmed in round %s", txId, pendingInfo["confirmed-round"]);
            break;
        }
        lastround++;
        await algodClient.statusAfterBlock(lastround).do();
    }
}

const keypress = async () => {
    process.stdin.setRawMode(true)
    return new Promise(resolve => process.stdin.once('data', () => {
        process.stdin.setRawMode(false)
        resolve()
    }))
}

async function fetchAlgoWalletInfo() {
    if (algosdk.isValidAddress(accountObject.addr)) {
        const url = `https://algoindexer.testnet.algoexplorerapi.io/v2/accounts/${accountObject.addr}`;
        const urlTrx = `https://algoindexer.testnet.algoexplorerapi.io/v2/accounts/${accountObject.addr}/transactions?limit=10`;
        let res = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        let data = await res.json()
        if (data) {
            if (data.account) {
                if (String(data.account.address) === String(accountObject.addr)) {

                    accountBalance = data.account.amount

                    assetsHeld = data.account.assets
                    assetsCreated = data.account["created-assets"]
                    appsCreated = data.account["created-apps"]
                    assetsHeldBalance = !!assetsHeld ? assetsHeld.length : 0
                    assetsCreatedBalance = !!assetsCreated ? assetsCreated.length : 0
                    if (appsCreated) appsCreatedBalance = appsCreated.length


                    logger.info('------------------------------')
                    logger.info("Account Balance = %s", accountBalance);
                    logger.info('------------------------------')
                    logger.info("Account Created Assets = %s", JSON.stringify(assetsCreated, null, 2));
                    logger.info('------------------------------')
                    logger.info("Account Created Assets Balance= %s", assetsHeldBalance);
                    logger.info('------------------------------')
                    logger.info("Account Held Assets = %s", JSON.stringify(assetsHeld, null, 2));
                    logger.info('------------------------------')
                    logger.info("Account Held Assets Balance= %s", + assetsHeldBalance);
                    logger.info('------------------------------')
                    logger.info("Account Created Apps = %s", JSON.stringify(appsCreated, null, 2));
                    logger.info('------------------------------')
                    logger.info("Account Created Apps Balance = %s", appsCreatedBalance);
                    logger.info('------------------------------')
                }
            }

        }
        let resTrx = await fetch(urlTrx, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        let dataTrx = await resTrx.json()
        if (dataTrx) {
            if (dataTrx.transactions) {

                trxPayment = dataTrx.transactions.filter(
                    (trx) => !!trx["payment-transaction"]
                )
                trxTransfer = dataTrx.transactions.filter(
                    (trx) => !!trx["asset-transfer-transaction"]
                )
                logger.info('trxPayment: %s', trxPayment.length)
                logger.info('trxTransfer: %s', trxTransfer.length)

            }
        }


    }
}

async function printCreatedAsset() {

    let accountInfo = await indexerClient.lookupAccountByID(accountObject.addr).do();

    accountBalance = accountInfo.account.amount

    assetsCreated = accountInfo['account']["created-assets"]


    assetsCreatedBalance = !!assetsCreated ? assetsCreated.length : 0



    logger.info('------------------------------')
    logger.info("Printed Account Balance = %s", accountBalance);
    logger.info('------------------------------')
    logger.info("Printed Account Created Assets = %s", JSON.stringify(!!assetsCreated ? assetsCreated.length : {}, null, 2));
    logger.info('------------------------------')
    logger.info("Printed Account Created Assets Balance= %s", assetsHeldBalance);
    logger.info('------------------------------')

    if (!!assetsCreated) {
        for (idx = 0; idx < accountInfo['account']['created-assets'].length; idx++) {
            let sAsset = accountInfo['account']['created-assets'][idx];
            if (assetid) {
                if (sAsset['index'] == assetid) {
                    let params = JSON.stringify(sAsset['params'], null, 2);
                    logger.info('------------------------------')
                    logger.info("AssetID = %s", sAsset['index']);
                    logger.info("Asset params = %s", params);
                    break;
                }
            } else {
                let params = JSON.stringify(sAsset['params'], null, 2);
                logger.info('------------------------------')
                logger.info("Created AssetID = %s", sAsset['index']);
                logger.info("Created Asset Info = %s", params);
            }
        }
    }
}

async function printAssetHolding(account, assetid) {
    let accountInfo = await indexerClient.lookupAccountByID(account).do();
    accountBalance = accountInfo.account.amount

    assetsHeld = accountInfo.account.assets


    assetsHeldBalance = !!assetsHeld ? assetsHeld.length : 0




    logger.info('------------------------------')
    logger.info("Printed Account Balance = %s", accountBalance);
    logger.info('------------------------------')

    logger.info("Printed Account Held Assets = %s", JSON.stringify(!!assetsHeld ? assetsHeld.length : {}, null, 2));
    logger.info('------------------------------')
    logger.info("Printed Account Held Assets Balance= %s", assetsHeldBalance);
    logger.info('------------------------------')

    if (!!assetsHeld) {
        for (idx = 0; idx < accountInfo['account']['assets'].length; idx++) {
            let sAsset = accountInfo['account']['assets'][idx];
            if (assetid) {
                if (sAsset['asset-id'] == assetid) {
                    let assetHoldings = JSON.stringify(sAsset, null, 2);
                    logger.info("Printed Held Asset Info = %s", assetHoldings);
                    break;
                }
            } else {
                let assetHoldings = JSON.stringify(sAsset, null, 2);
                logger.info('------------------------------')
                logger.info("Printed Held AssetID = %s", sAsset['asset-id']);
                logger.info("Printed Held Asset Info = %s", assetHoldings);
            }
        }
    }
}

async function deployMainContract(addr, acc) {
    localInts = config.deployer['num_local_int'];
    localBytes = config.deployer['num_local_byte'];
    globalInts = config.deployer['num_global_int'];
    globalBytes = config.deployer['num_global_byte'];
    let params = await algodClient.getTransactionParams().do();
    onComplete = algosdk.OnApplicationComplete.NoOpOC;
    const filePathApproval = path.join(__dirname, 'algopoap-main.teal');
    const filePathClear = path.join(__dirname, 'algopoap-clear.teal');
    const approvalProgData = await fs.promises.readFile(filePathApproval);
    const clearProgData = await fs.promises.readFile(filePathClear);
    const compiledResult = await algodClient.compile(approvalProgData).do();
    const compiledClearResult = await algodClient.compile(clearProgData).do();
    const compiledResultUint8 = new Uint8Array(Buffer.from(compiledResult.result, "base64"));
    const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledClearResult.result, "base64"));
    logger.info('------------------------------')
    logger.info("AlgoPoaP Main Contract Hash = %s", compiledResult.hash);
    //logger.info("AlgoPoaP Main Contract Result = %s", compiledResult.result)
    logger.info("AlgoPoaP Clear Hash = %s", compiledClearResult.hash);
    //logger.info("AlgoPoaP Clear Result = %s", compiledClearResult.result);

    let appTxn = algosdk.makeApplicationCreateTxn(addr, params, onComplete,
        compiledResultUint8, compiledClearResultUint8,
        localInts, localBytes, globalInts, globalBytes);
    let appTxnId = appTxn.txID().toString();
    logger.info('------------------------------')
    logger.info("AlgoPoaP Main Application Creation TXId =  %s", appTxnId);
    let signedAppTxn = appTxn.signTxn(acc.sk);
    await algodClient.sendRawTransaction(signedAppTxn).do();
    await algosdk.waitForConfirmation(algodClient, appTxnId, 5)
    //await waitForConfirmation(appTxnId);
    let transactionResponse = await algodClient.pendingTransactionInformation(appTxnId).do();
    let appId = transactionResponse['application-index'];
    logger.info('------------------------------')
    logger.info("AlgoPoaP Main Application ID: %s", appId);
    logger.info('------------------------------')
    applicationId = appId
    applicationAddr = algosdk.getApplicationAddress(appId);
    logger.info('------------------------------')
    logger.info("AlgoPoaP Main Application Address: %s", applicationAddr);
    logger.info('------------------------------')
}
async function updateMainContract(addr, acc) {
    let params = await algodClient.getTransactionParams().do();
    onComplete = algosdk.OnApplicationComplete.UpdateApplicationOC;
    const filePathApproval = path.join(__dirname, 'algopoap-main.teal');
    const filePathClear = path.join(__dirname, 'algopoap-clear.teal');
    const approvalProgData = await fs.promises.readFile(filePathApproval);
    const clearProgData = await fs.promises.readFile(filePathClear);
    const compiledResult = await algodClient.compile(approvalProgData).do();
    const compiledClearResult = await algodClient.compile(clearProgData).do();
    const compiledResultUint8 = new Uint8Array(Buffer.from(compiledResult.result, "base64"));
    const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledClearResult.result, "base64"));
    logger.info('------------------------------')
    logger.info("AlgoPoaP Main Contract Hash = %s", compiledResult.hash);
    //logger.info("AlgoPoaP Main Contract Result = %s", compiledResult.result)
    logger.info("AlgoPoaP Clear Hash = %s", compiledClearResult.hash);
    //logger.info("AlgoPoaP Clear Result = %s", compiledClearResult.result);
    /*   let note = algosdk.encodeObj(
          `Update AlgoPoaP Application ID: ${applicationId}`
      ); */


    let appTxn = algosdk.makeApplicationUpdateTxn(addr, params, Number(applicationId),
        compiledResultUint8, compiledClearResultUint8);
    let appTxnId = appTxn.txID().toString();
    logger.info('------------------------------')
    logger.info("AlgoPoaP Main Application Update TXId =  %s", appTxnId);
    let signedAppTxn = appTxn.signTxn(acc.sk);
    await algodClient.sendRawTransaction(signedAppTxn).do();
    await algosdk.waitForConfirmation(algodClient, appTxnId, 5)
    //await waitForConfirmation(appTxnId);
    let transactionResponse = await algodClient.pendingTransactionInformation(appTxnId).do();

    logger.info('------------------------------')
    logger.info("AlgoPoaP Updated Main Application ID: %s", applicationId);
    logger.info('------------------------------')

    applicationAddr = algosdk.getApplicationAddress(Number(applicationId));
    logger.info('------------------------------')
    logger.info("AlgoPoaP Updated Main Application Address: %s", applicationAddr);
    logger.info('------------------------------')
}
function getMethodByName(name, contract) {
    const m = contract.methods.find((mt) => { return mt.name == name })
    if (m === undefined)
        throw Error("Method undefined: " + name)
    return m
}
async function setupMainContract(addr, acc) {
    let params = await algodClient.getTransactionParams().do();
    const atc = new algosdk.AtomicTransactionComposer()
    const signer = algosdk.makeBasicAccountTransactionSigner(acc)
    const filePathContractSchema = path.join(__dirname, 'algopoap-contract.json');
    const buff = await fs.promises.readFile(filePathContractSchema);
    const contract = new algosdk.ABIContract(JSON.parse(buff.toString()))
    const commonParams = {
        appID: Number(applicationId),
        sender: acc.addr,
        suggestedParams: params,
        signer: signer
    }
    let method = getMethodByName("setup", contract)
    atc.addMethodCall({
        method: method,
        methodArgs: ['v0.0.4'],
        ...commonParams
    })
    logger.info('------------------------------')
    logger.info("AlgoPoaP Main Contract ABI Exec method = %s", method);
    const result = await atc.execute(algodClient, 2)
    for (const idx in result.methodResults) {
        let buff = Buffer.from(result.methodResults[idx].rawReturnValue, "base64")
        let res = buff.slice(2, buff.byteLength).toString()
        logger.info("AlgoPoaP Main Contract ABI Exec method result = %s", res);


    }
}
async function getMainMetrics(addr, acc) {
    let params = await algodClient.getTransactionParams().do();
    const atc = new algosdk.AtomicTransactionComposer()
    const signer = algosdk.makeBasicAccountTransactionSigner(acc)
    const filePathContractSchema = path.join(__dirname, 'algopoap-contract.json');
    const buff = await fs.promises.readFile(filePathContractSchema);
    const contract = new algosdk.ABIContract(JSON.parse(buff.toString()))
    const commonParams = {
        appID: Number(applicationId),
        sender: acc.addr,
        suggestedParams: params,
        signer: signer
    }
    let method = getMethodByName("get_metrics", contract)
    atc.addMethodCall({
        method: method,
        methodArgs: [],
        ...commonParams
    })
    logger.info('------------------------------')
    logger.info("AlgoPoaP Main Contract ABI Exec method = %s", method);
    const result = await atc.execute(algodClient, 2)
    for (const idx in result.methodResults) {
        let buff = Buffer.from(result.methodResults[idx].rawReturnValue, "base64")
        let res = buff.toString()
        logger.info("AlgoPoaP Main Contract ABI Exec method result = %s", res);


    }
}
async function getMainMetric(addr, acc) {
    let params = await algodClient.getTransactionParams().do();
    const atc = new algosdk.AtomicTransactionComposer()
    const signer = algosdk.makeBasicAccountTransactionSigner(acc)
    const filePathContractSchema = path.join(__dirname, 'algopoap-contract.json');
    const buff = await fs.promises.readFile(filePathContractSchema);
    const contract = new algosdk.ABIContract(JSON.parse(buff.toString()))
    const commonParams = {
        appID: Number(applicationId),
        sender: acc.addr,
        suggestedParams: params,
        signer: signer
    }
    let method = getMethodByName("get_metric", contract)
    atc.addMethodCall({
        method: method,
        methodArgs: ['poap_count'],
        ...commonParams
    })
    logger.info('------------------------------')
    logger.info("AlgoPoaP Main Contract ABI Exec method = %s", method);
    const result = await atc.execute(algodClient, 2)
    for (const idx in result.methodResults) {
        let buff = Buffer.from(result.methodResults[idx].rawReturnValue, "base64")
        let res = buff.toString()
        logger.info("AlgoPoaP Main Contract ABI Exec method result = %s", res);


    }
}
async function deployItemContract(addr, acc) {
    let params = await algodClient.getTransactionParams().do();
    const atc = new algosdk.AtomicTransactionComposer()
    const signer = algosdk.makeBasicAccountTransactionSigner(acc)
    const filePathContractSchema = path.join(__dirname, 'algopoap-contract.json');
    const filePathItemContract = path.join(__dirname, 'algopoap-item.teal');
    const filePathItemContractClear = path.join(__dirname, 'algopoap-clear.teal');
    const itemApprovalProgData = await fs.promises.readFile(filePathItemContract);
    const itemClearProgData = await fs.promises.readFile(filePathItemContractClear);
    const compiledItemResult = await algodClient.compile(itemApprovalProgData).do();
    const compiledItemClearResult = await algodClient.compile(itemClearProgData).do();
    const compiledResultUint8 = new Uint8Array(Buffer.from(compiledItemResult.result, "base64"));
    const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledItemClearResult.result, "base64"));




    const buff = await fs.promises.readFile(filePathContractSchema);
    const contract = new algosdk.ABIContract(JSON.parse(buff.toString()))
    const commonParams = {
        appID: Number(applicationId),
        sender: acc.addr,
        suggestedParams: params,
        signer: signer
    }
    let method = getMethodByName("item_create", contract)
    
    const ptxn = new algosdk.Transaction({
        from: acc.addr,
        to: applicationAddr,
        amount: 100000,
        ...params
    })

    const tws = { txn: ptxn, signer: signer }

    atc.addMethodCall({
        method: method,
        methodArgs: [tws,compiledResultUint8, compiledClearResultUint8],
        ...commonParams
    })
    logger.info('------------------------------')
    logger.info("AlgoPoaP Item Contract ABI Exec method = %s", method);
    const result = await atc.execute(algodClient, 2)
    for (const idx in result.methodResults) {
      
        let res = algosdk.decodeUint64(result.methodResults[idx].rawReturnValue)
        logger.info("AlgoPoaP Main Contract ABI Exec method result = %s", res);


    }
}
async function updateItemContract(addr, acc) {
    let params = await algodClient.getTransactionParams().do();
    const atc = new algosdk.AtomicTransactionComposer()
    const signer = algosdk.makeBasicAccountTransactionSigner(acc)
    const filePathContractSchema = path.join(__dirname, 'algopoap-contract.json');
    const filePathItemContract = path.join(__dirname, 'algopoap-item.teal');
    const filePathItemContractClear = path.join(__dirname, 'algopoap-clear.teal');
    const itemApprovalProgData = await fs.promises.readFile(filePathItemContract);
    const itemClearProgData = await fs.promises.readFile(filePathItemContractClear);
    const compiledItemResult = await algodClient.compile(itemApprovalProgData).do();
    const compiledItemClearResult = await algodClient.compile(itemClearProgData).do();
    const compiledResultUint8 = new Uint8Array(Buffer.from(compiledItemResult.result, "base64"));
    const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledItemClearResult.result, "base64"));




    const buff = await fs.promises.readFile(filePathContractSchema);
    const contract = new algosdk.ABIContract(JSON.parse(buff.toString()))
    const commonParams = {
        appID: Number(applicationId),
        sender: acc.addr,
        suggestedParams: params,
        signer: signer
    }
    let method = getMethodByName("item_update", contract)
    

    atc.addMethodCall({
        method: method,
        methodArgs: [applicationItemId,compiledResultUint8, compiledClearResultUint8],
        ...commonParams
    })
    logger.info('------------------------------')
    logger.info("AlgoPoaP Item Contract ABI Exec method = %s", method);
    const result = await atc.execute(algodClient, 2)
    for (const idx in result.methodResults) {
      
        let res = algosdk.decodeUint64(result.methodResults[idx].rawReturnValue)
        logger.info("AlgoPoaP Main Contract ABI Exec method result = %s", res);


    }
}
async function deleteItemContract(addr, acc) {
    let params = await algodClient.getTransactionParams().do();
    const atc = new algosdk.AtomicTransactionComposer()
    const signer = algosdk.makeBasicAccountTransactionSigner(acc)
    const filePathContractSchema = path.join(__dirname, 'algopoap-contract.json');

    const buff = await fs.promises.readFile(filePathContractSchema);
    const contract = new algosdk.ABIContract(JSON.parse(buff.toString()))
    const commonParams = {
        appID: Number(applicationId),
        sender: acc.addr,
        suggestedParams: params,
        signer: signer
    }
    let method = getMethodByName("item_delete", contract)
    

    atc.addMethodCall({
        method: method,
        methodArgs: [applicationItemId],
        ...commonParams
    })
    logger.info('------------------------------')
    logger.info("AlgoPoaP Item Contract ABI Exec method = %s", method);
    const result = await atc.execute(algodClient, 2)
    for (const idx in result.methodResults) {
      
        
        logger.info("AlgoPoaP Main Contract ABI Exec method result: void");


    }
}
async function setupItemContract(addr, acc) {
    let params = await algodClient.getTransactionParams().do();
    const atc = new algosdk.AtomicTransactionComposer()
    const signer = algosdk.makeBasicAccountTransactionSigner(acc)
    const filePathContractSchema = path.join(__dirname, 'algopoap-item-contract.json');


    const buff = await fs.promises.readFile(filePathContractSchema);
    const contract = new algosdk.ABIContract(JSON.parse(buff.toString()))
    const commonParams = {
        appID: Number(Number(applicationItemId)),
        sender: acc.addr,
        suggestedParams: params,
        signer: signer
    }
    const ptxn = new algosdk.Transaction({
        from: acc.addr,
        to: applicationAddr,
        amount: 100000,
        ...params
    })

    const tws = { txn: ptxn, signer: signer }
    let method = getMethodByName("setup", contract)
    

    atc.addMethodCall({
        method: method,
        methodArgs: [tws,addr, Number(applicationId), 30,323234,100,234565, 150,11111111,22222222,'poap_name','poap_logo','poap_desc','poap_timezone','poap_address','poap_url','poap_email','poap_company_name','poap_company_logo',true,true,false,false],
        ...commonParams
    })
    logger.info('------------------------------')
    logger.info("AlgoPoaP Item Contract ABI Exec method = %s", method);
    const result = await atc.execute(algodClient, 2)
    for (const idx in result.methodResults) {
      
        let res = algosdk.decodeUint64(result.methodResults[idx].rawReturnValue)
        logger.info("AlgoPoaP Main Contract ABI Exec method result = %s", res);


    }
}
async function deployerAccount() {

    try {
        accountObject = await importAccount();
        accountAddress = accountObject.addr;

        accountExists = true;
        /* await keypress(); */

    }
    catch (err) {
        logger.error(err);
    }

}




async function deployerReport() {

    try {
        if (!accountExists) await deployerAccount()

        await fetchAlgoWalletInfo()

        await printCreatedAsset();
        await printAssetHolding(accountObject.addr);


    }
    catch (err) {
        logger.error(err);
    }

}

async function deleteApps(appsTodelete) {
    let wallet = config.algorand.algo_wallet_address
    let apps = appsTodelete || []
    if (!accountExists) await deployerAccount()
    for (let i = 0; i < apps.length; i++) {
        logger.info('Now deleting AlgoPoaP APP: %s', apps[i])

        let params = await algodClient.getTransactionParams().do();
        params.fee = 1000;
        params.flatFee = true;
        let sender = wallet;
        let revocationTarget = undefined;
        let closeRemainderTo = undefined;

        let note = algosdk.encodeObj(
            JSON.stringify({
                system: "Deleting AlgoPoaP main app",
                date: `${new Date()}`,
            })
        );


        let txn = algosdk.makeApplicationDeleteTxnFromObject({
            suggestedParams: params,
            type: "appl",
            appIndex: Number(apps[i]),
            from: sender,
            appOnComplete: 5,
            note: note,
            closeRemainderTo: undefined,
            revocationTarget: undefined,
            rekeyTo: undefined,
        });
        const signedTxn = txn.signTxn(accountObject.sk);
        const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
        await algosdk.waitForConfirmation(algodClient, txId, 5)
        //await waitForConfirmation(txId);
        let ptx = await algodClient.pendingTransactionInformation(txId).do();

        const noteArrayFromTxn = ptx.txn.txn.note;
        const receivedNote = Buffer.from(noteArrayFromTxn).toString('utf8');
        logger.info("Note from confirmed AlgoPoaP Delete TXN: %s", receivedNote);
    }

}


async function runDeployer() {
    if (!accountExists) await deployerAccount()
    if (config.deployer['deployer_contracts']) {
        try {

            await deployMainContract(accountObject.addr, accountObject)


        }
        catch (err) {
            logger.error(err);
        }
    }
    if (config.deployer['deployer_update_contracts']) {
        {
            try {

                await updateMainContract(accountObject.addr, accountObject)

            }
            catch (err) {
                logger.error(err);
            }
        }
    }
    if (config.deployer['setup_app']) {
        {
            try {

                await setupMainContract(accountObject.addr, accountObject)




            }
            catch (err) {
                logger.error(err);
            }
        }
    }
    if (config.deployer['test_metrics']) {
        {
            try {

                await getMainMetrics(accountObject.addr, accountObject)
                await getMainMetric(accountObject.addr, accountObject)



            }
            catch (err) {
                logger.error(err);
            }
        }
    }
    if (config.deployer['test_item_create']) {
        {
            try {

                await deployItemContract(accountObject.addr, accountObject)
    



            }
            catch (err) {
                logger.error(err);
            }
        }
    }
    if (config.deployer['test_item_update']) {
        {
            try {

                await updateItemContract(accountObject.addr, accountObject)
    



            }
            catch (err) {
                logger.error(err);
            }
        }
    }
    if (config.deployer['test_item_delete']) {
        {
            try {

                await deleteItemContract(accountObject.addr, accountObject)
    



            }
            catch (err) {
                logger.error(err);
            }
        }
    }
    if (config.deployer['test_item_setup']) {
        {
            try {

                await setupItemContract(accountObject.addr, accountObject)
    



            }
            catch (err) {
                logger.error(err);
            }
        }
    }
    if (config.deployer['deployer_report']) await deployerReport()
    if (config.deployer['delete_apps']) await deleteApps(config.deployer.apps_to_delete)

    process.exit();
}

module.exports = runDeployer