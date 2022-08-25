// A cave man simple deployer to mend the progress with rapid deployment of AlgoPoaP contracts

const algosdk = require('algosdk');
const fs = require('fs')
const path = require('path');
const fetch = require('node-fetch');
const logger = require('./logger');
const config = require('./config.json');
const mode = config.deployer.mode
const appExists = false
let accountExists = false;

// Global scope variables
let algodToken;
let algodPort;
let algodServer;
let indexerPort;

let applicationAddr;
let applicationId;
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
    if (algosdk.isValidAddress(accountAddress)) {
        const url = `https://algoindexer.testnet.algoexplorerapi.io/v2/accounts/${accountAddress}`;
        const urlTrx = `https://algoindexer.testnet.algoexplorerapi.io/v2/accounts/${accountAddress}/transactions?limit=10`;
        let res = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        let data = await res.json()
        if (data) {
            if (data.account) {
                if (String(data.account.address) === String(accountAddress)) {

                    accountBalance = data.account.amount

                    assetsHeld = data.account.assets
                    assetsCreated = data.account["created-assets"]
                    appsCreated = data.account["created-apps"]
                    assetsHeldBalance = assetsHeld.length
                    assetsCreatedBalance = assetsCreated.length
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

async function printCreatedAsset(account, assetid) {

    let accountInfo = await indexerClient.lookupAccountByID(account).do();

    accountBalance = accountInfo.account.amount

    assetsCreated = accountInfo['account']["created-assets"]


    assetsCreatedBalance = assetsCreated.length



    logger.info('------------------------------')
    logger.info("Printed Account Balance = %s", accountBalance);
    logger.info('------------------------------')
    logger.info("Printed Account Created Assets = %s", JSON.stringify(assetsCreated, null, 2));
    logger.info('------------------------------')
    logger.info("Printed Account Created Assets Balance= %s", assetsHeldBalance);
    logger.info('------------------------------')

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

async function printAssetHolding(account, assetid) {
    let accountInfo = await indexerClient.lookupAccountByID(account).do();
    accountBalance = accountInfo.account.amount

    assetsHeld = accountInfo.account.assets


    assetsHeldBalance = assetsHeld.length




    logger.info('------------------------------')
    logger.info("Printed Account Balance = %s", accountBalance);
    logger.info('------------------------------')

    logger.info("Printed Account Held Assets = %s", JSON.stringify(assetsHeld, null, 2));
    logger.info('------------------------------')
    logger.info("Printed Account Held Assets Balance= %s", assetsHeldBalance);
    logger.info('------------------------------')

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

async function deployMainContract(addr, acc) {
    localInts = config.deployer['num_local_int'];
    localBytes = config.deployer['num_local_byte'];
    globalInts = config.deployer['num_global_int'];
    globalBytes = config.deployer['num_global_byte'];
    let params = await algodClient.getTransactionParams().do();
    onComplete = algosdk.OnApplicationComplete.NoOpOC;
    const filePathApproval = path.join(__dirname, 'smart_contracts/algopoap-main.teal');
    const filePathClear = path.join(__dirname, 'smart_contracts/algopoap-clear.teal');
    const approvalProgData = await fs.promises.readFile(filePathApproval);
    const clearProgData = await fs.promises.readFile(filePathClear);
    const compiledResult = await algodClient.compile(approvalProgData).do();
    const compiledClearResult = await algodClient.compile(clearProgData).do();
    const compiledResultUint8 = new Uint8Array(Buffer.from(compiledResult.result, "base64"));
    const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledClearResult.result, "base64"));
    logger.info('------------------------------')
    logger.info("AlgoPoaP Main Contract Hash = %s", compiledResult.hash);
    logger.info("AlgoPoaP Main Contract Result = %s", compiledResult.result)
    logger.info("AlgoPoaP Clear Hash = %s", compiledClearResult.hash);
    logger.info("AlgoPoaP Clear Result = %s", compiledClearResult.result);

    let appTxn = algosdk.makeApplicationCreateTxn(addr, params, onComplete,
        compiledResultUint8, compiledClearResultUint8,
        localInts, localBytes, globalInts, globalBytes);
    let appTxnId = appTxn.txID().toString();
    logger.info('------------------------------')
    logger.info("AlgoPoaP Main Application Creation TXId =  %s", appTxnId);
    let signedAppTxn = appTxn.signTxn(acc.sk);
    await algodClient.sendRawTransaction(signedAppTxn).do();
    await waitForConfirmation(appTxnId);
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

async function setup() {

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


async function deployerContracts() {

    try {
        if (!accountExists) await deployerAccount()
        await deployMainContract(accountObject.addr, accountObject)
        await setup(accountObject.addr, accountObject)

    }
    catch (err) {
        logger.error(err);
    }

}

async function deployerReport() {

    try {
        if (!accountExists) await deployerAccount()

        await fetchAlgoWalletInfo()

        await printCreatedAsset(accountObject.addr);
        await printAssetHolding(accountObject.addr);

        await fetchEscrowInfo(accountObject.addr)

    }
    catch (err) {
        logger.error(err);
    }

}

async function deleteApps(walletToDeleteFrom, appsTodelete) {
    let wallet = walletToDeleteFrom || 'UTI7PAASILRDA3ISHY5M7J7LNRX2AIVQJWI7ZKCCGKVLMFD3VPR5PWSZ4I'
    let apps = appsTodelete || []
    for (let i = 0; i < apps.length; i++) {
        logger.info('Now deleting APP: %s', appId)
        if (!accountExists) await deployerAccount()
        let params = await algodClient.getTransactionParams().do();
        params.fee = 1000;
        params.flatFee = true;
        let sender = wallet;
        let revocationTarget = undefined;
        let closeRemainderTo = undefined;

        let note = algosdk.encodeObj(
            JSON.stringify({
                system: "Deleting Test App",
                date: `${new Date()}`,
            })
        );


        let txn = algosdk.makeApplicationDeleteTxnFromObject({
            suggestedParams: params,
            type: "appl",
            appIndex: appId,
            from: sender,
            appOnComplete: 5,
            note: note,
            closeRemainderTo: undefined,
            revocationTarget: undefined,
            rekeyTo: undefined,
        });
        const signedTxn = txn.signTxn(accountObject.sk);
        const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
        await waitForConfirmation(txId);
        let ptx = await algodClient.pendingTransactionInformation(txId).do();

        const noteArrayFromTxn = ptx.txn.txn.note;
        const receivedNote = Buffer.from(noteArrayFromTxn).toString('utf8');
        logger.info("Note from confirmed Delete Transaction: %s", receivedNote);
    }

}

async function makeDebugPrep() {
    const suggestedParams = await algodClient.getTransactionParams().do();
    let note = algosdk.encodeObj(
        JSON.stringify({
            system: "Depositing Algo token",
            date: `${new Date()}`,
        })
    );
    txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        suggestedParams,
        type: "pay",
        from: "DLTZXEDLXS5V6OQOMX5DBKXBO6E47F4II6ULUXRN6CIXHRMBV2XCAMG42E",
        to: "BJATCHES5YJZJ7JITYMVLSSIQAVAWBQRVGPQUDT5AZ2QSLDSXWWM46THOY",
        amount: 2,
        note: note,
        closeRemainderTo: undefined,
        revocationTarget: undefined,
        rekeyTo: undefined,
    });
    appcall = algosdk.makeApplicationNoOpTxnFromObject(
        {
            suggestedParams,
            from: "DLTZXEDLXS5V6OQOMX5DBKXBO6E47F4II6ULUXRN6CIXHRMBV2XCAMG42E",

            appIndex: Number("75710837"),
            appArgs: [
                algosdk.encodeObj("AmMYkM2PBqzm44JJsuufE4FS6rhMMjcAEpmf3VwN9ArF"),
                algosdk.encodeObj("DLTZXEDLXS5V6OQOMX5DBKXBO6E47F4II6ULUXRN6CIXHRMBV2XCAMG42E"),
                algosdk.encodeObj("HMx8h6yJf7kEMYzrVcgcvLSihrZkLeoXpX6SKrMaNKVK"),
                algosdk.encodeObj("75394438"),
                algosdk.encodeObj("algo-deposit"),
                algosdk.encodeObj(""),
                algosdk.encodeObj(String(Number(2)))
            ],
            rekeyTo: undefined
        }
    );
    txnsArray = [appcall, txn];
    const groupID = algosdk.computeGroupID(txnsArray);
    for (let i = 0; i < 2; i++) txnsArray[i].group = groupID;

    rawSignedTxn =
        txnsArray.map((txn) => {
            //txn = txn.toByte()
            return txn.signTxn(accountObject.sk)

        });


}

async function runDeployer() {
    await deployerAccount()
    if (config.deployer['deployer_contracts']) await deployerContracts()
    if (config.deployer['deployer_report']) await deployerReport()
    if (config.deployer['delete_apps']) await deleteApps(accountAddress)
    if (config.deployer['make_debug_prep']) await makeDebugPrep()
    process.exit();
}

module.exports = runDeployer