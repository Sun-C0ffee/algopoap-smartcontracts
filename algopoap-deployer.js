// A cave man simple deployer to mend the progress with rapid deployment of AlgoPoaP contracts




const geolib = require('geolib');
const fetch = require('node-fetch');

const AlgoPoapDeployer = class {
    constructor(props) {
        this.config = props.config
        this.logger = props.logger
        this.algosdk = props.algosdk
        this.mode = props.config.deployer.mode
        this.geoIndex = props.config.deployer.geo_index
        this.applicationAddr = props.config.algorand.asc_main_address
        this.applicationItemAddr = props.config.algorand.asc_item_address
        this.applicationId = props.config.algorand.asc_main_id
        this.applicationItemId = props.config.algorand.asc_last_item_id
        this.itemAsaId = props.config.algorand.item_asa_id
        this.algodServer = props.config.algorand.algod_remote_server
        this.algodToken = props.config.algorand.algod_remote_token
        this.algodPort = props.config.algorand.algod_remote_port
        this.algodClient = new props.algosdk.Algodv2(this.algodToken, this.algodServer, this.algodPort)
        this.indexerServer = props.config.algorand.indexer_remote_server
        this.indexerToken = props.config.algorand.indexer_remote_token
        this.indexerPort = props.config.algorand.indexer_remote_port
        this.indexerClient = new props.algosdk.Indexer(this.algodToken, this.indexerServer, this.indexerPort)
        this.mnemonic = props.mnemonic
        this.approvalProgData = props.approvalProgData
        this.clearProgData = props.clearProgData
        this.contract = props.contract
        this.itemApprovalProgData = props.itemApprovalProgData
        this.itemClearProgData = props.itemClearProgData
        this.itemContract = props.itemContract
        this.accountObject = null
        this.accountAddress = null
        this.accountBalance = null
        this.assetsHeld = null
        this.assetsCreated = null
        this.appsCreated = null
        this.assetsHeldBalance = null
        this.assetsCreatedBalance = null
        this.trxPayment = null
        this.trxTransfer = null

    }
    importAccount() {
        const acc = this.algosdk.mnemonicToSecretKey(this.mnemonic);
        this.logger.info("Account Address = %s", acc.addr);
        let acc_mnemonic_check = this.algosdk.secretKeyToMnemonic(acc.sk);
        let acc_decoded = this.algosdk.decodeAddress(acc.addr);
        this.logger.info("Account Address Decoded Public Key = %s", acc_decoded.publicKey.toString());
        this.logger.info("Account Address Decoded Checksum = %s", acc_decoded.checksum.toString());
        let acc_encoded = this.algosdk.encodeAddress(acc_decoded.publicKey);
        this.logger.info("Account Address Encoded = %s", acc_encoded);
        this.logger.warn(this.config.algorand['algo_dispencer'] + acc.addr);
        return acc;
    };
    async waitForConfirmation(txId) {
        this.logger.info("waiting for transaction: %s", txId)
        let response = await this.algodClient.status().do();
        let lastround = response["last-round"];
        while (true) {
            const pendingInfo = await this.algodClient
                .pendingTransactionInformation(txId)
                .do();
            if (
                pendingInfo["confirmed-round"] !== null &&
                pendingInfo["confirmed-round"] > 0
            ) {
                this.logger.info(
                    "Transaction %s  confirmed in round %s", txId, pendingInfo["confirmed-round"]);
                break;
            }
            lastround++;
            await this.algodClient.statusAfterBlock(lastround).do();
        }
    }
    async fetchAlgoWalletInfo() {
        if (this.algosdk.isValidAddress(this.accountObject.addr)) {
            const url = `https://algoindexer.testnet.algoexplorerapi.io/v2/accounts/${this.accountObject.addr}`;
            const urlTrx = `https://algoindexer.testnet.algoexplorerapi.io/v2/accounts/${this.accountObject.addr}/transactions?limit=10`;
            let res = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            let data = await res.json()
            if (data) {
                if (data.account) {
                    if (String(data.account.address) === String(this.accountObject.addr)) {
                        this.accountBalance = data.account.amount
                        this.assetsHeld = data.account.assets
                        this.assetsCreated = data.account["created-assets"]
                        this.appsCreated = data.account["created-apps"]
                        this.assetsHeldBalance = !!this.assetsHeld ? this.assetsHeld.length : 0
                        this.assetsCreatedBalance = !!this.assetsCreated ? this.assetsCreated.length : 0
                        if (this.appsCreated) this.appsCreatedBalance = this.appsCreated.length

                        this.logger.info('------------------------------')
                        this.logger.info("Account Balance = %s", this.accountBalance);
                        this.logger.info('------------------------------')
                        this.logger.info("Account Created Assets = %s", JSON.stringify(this.assetsCreated, null, 2));
                        this.logger.info('------------------------------')
                        this.logger.info("Account Created Assets Balance= %s", this.assetsHeldBalance);
                        this.logger.info('------------------------------')
                        this.logger.info("Account Held Assets = %s", JSON.stringify(this.assetsHeld, null, 2));
                        this.logger.info('------------------------------')
                        this.logger.info("Account Held Assets Balance= %s", + this.assetsHeldBalance);
                        this.logger.info('------------------------------')
                        this.logger.info("Account Created Apps = %s", JSON.stringify(this.appsCreated, null, 2));
                        this.logger.info('------------------------------')
                        this.logger.info("Account Created Apps Balance = %s", this.appsCreatedBalance);
                        this.logger.info('------------------------------')
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
                    this.trxPayment = dataTrx.transactions.filter(
                        (trx) => !!trx["payment-transaction"]
                    )
                    this.trxTransfer = dataTrx.transactions.filter(
                        (trx) => !!trx["asset-transfer-transaction"]
                    )
                    this.logger.info('trxPayment: %s', this.trxPayment.length)
                    this.logger.info('trxTransfer: %s', this.trxTransfer.length)

                }
            }


        }
    }
    async printCreatedAsset() {
        let accountInfo = await this.indexerClient.lookupAccountByID(this.accountObject.addr).do();
        this.accountBalance = accountInfo.account.amount
        this.assetsCreated = accountInfo['account']["created-assets"]
        this.assetsCreatedBalance = !!this.assetsCreated ? this.assetsCreated.length : 0

        this.logger.info('------------------------------')
        this.logger.info("Printed Account Balance = %s", this.accountBalance);
        this.logger.info('------------------------------')
        this.logger.info("Printed Account Created Assets = %s", JSON.stringify(!!this.assetsCreated ? this.assetsCreated.length : {}, null, 2));
        this.logger.info('------------------------------')
        this.logger.info("Printed Account Created Assets Balance= %s", this.assetsHeldBalance);
        this.logger.info('------------------------------')

        if (!!this.assetsCreated) {
            for (let idx = 0; idx < accountInfo['account']['created-assets'].length; idx++) {
                let sAsset = accountInfo['account']['created-assets'][idx];
                if (assetid) {
                    if (sAsset['index'] == assetid) {
                        let params = JSON.stringify(sAsset['params'], null, 2);
                        this.logger.info('------------------------------')
                        this.logger.info("AssetID = %s", sAsset['index']);
                        this.logger.info("Asset params = %s", params);
                        break;
                    }
                } else {
                    let params = JSON.stringify(sAsset['params'], null, 2);
                    this.logger.info('------------------------------')
                    this.logger.info("Created AssetID = %s", sAsset['index']);
                    this.logger.info("Created Asset Info = %s", params);
                }
            }
        }
    }
    async printAssetHolding(account, assetid) {
        let accountInfo = await this.indexerClient.lookupAccountByID(account).do();
        this.accountBalance = accountInfo.account.amount
        this.assetsHeld = accountInfo.account.assets
        this.assetsHeldBalance = !!this.assetsHeld ? this.assetsHeld.length : 0

        this.logger.info('------------------------------')
        this.logger.info("Printed Account Balance = %s", this.accountBalance);
        this.logger.info('------------------------------')

        this.logger.info("Printed Account Held Assets = %s", JSON.stringify(!!this.assetsHeld ? this.assetsHeld.length : {}, null, 2));
        this.logger.info('------------------------------')
        this.logger.info("Printed Account Held Assets Balance= %s", this.assetsHeldBalance);
        this.logger.info('------------------------------')

        if (!!this.assetsHeld) {
            for (let idx = 0; idx < accountInfo['account']['assets'].length; idx++) {
                let sAsset = accountInfo['account']['assets'][idx];
                if (assetid) {
                    if (sAsset['asset-id'] == assetid) {
                        let assetHoldings = JSON.stringify(sAsset, null, 2);
                        this.logger.info("Printed Held Asset Info = %s", assetHoldings);
                        break;
                    }
                } else {
                    let assetHoldings = JSON.stringify(sAsset, null, 2);
                    this.logger.info('------------------------------')
                    this.logger.info("Printed Held AssetID = %s", sAsset['asset-id']);
                    this.logger.info("Printed Held Asset Info = %s", assetHoldings);
                }
            }
        }
    }
    async deployMainContract(addr, acc) {
        let localInts = this.config.deployer['num_local_int'];
        let localBytes = this.config.deployer['num_local_byte'];
        let globalInts = this.config.deployer['num_global_int'];
        let globalBytes = this.config.deployer['num_global_byte'];
        let params = await this.algodClient.getTransactionParams().do();
        let onComplete = this.algosdk.OnApplicationComplete.NoOpOC;

        const compiledResult = await this.algodClient.compile(this.approvalProgData).do();
        const compiledClearResult = await this.algodClient.compile(this.clearProgData).do();
        const compiledResultUint8 = new Uint8Array(Buffer.from(compiledResult.result, "base64"));
        const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledClearResult.result, "base64"));
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Main Contract Hash = %s", compiledResult.hash);
        //this.logger.info("AlgoPoaP Main Contract Result = %s", compiledResult.result)
        this.logger.info("AlgoPoaP Clear Hash = %s", compiledClearResult.hash);
        //this.logger.info("AlgoPoaP Clear Result = %s", compiledClearResult.result);

        let appTxn = this.algosdk.makeApplicationCreateTxnFromObject({
            from: addr, suggestedParams: params, onComplete,
            approvalProgram: compiledResultUint8, clearProgram: compiledClearResultUint8,
            numLocalInts: localInts, numLocalByteSlices: localBytes, numGlobalInts: globalInts, numGlobalByteSlices: globalBytes, extraPages: 1
        });
        let appTxnId = appTxn.txID().toString();
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Main Application Creation TXId =  %s", appTxnId);
        let signedAppTxn = appTxn.signTxn(acc.sk);
        await this.algodClient.sendRawTransaction(signedAppTxn).do();
        await this.algosdk.waitForConfirmation(this.algodClient, appTxnId, 5)
        //await waitForConfirmation(appTxnId);
        let transactionResponse = await this.algodClient.pendingTransactionInformation(appTxnId).do();
        let appId = transactionResponse['application-index'];
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Main Application ID: %s", appId);
        this.logger.info('------------------------------')
        this.applicationId = appId
        this.applicationAddr = this.algosdk.getApplicationAddress(appId);
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Main Application Address: %s", this.applicationAddr);
        this.logger.info('------------------------------')
    }
    async updateMainContract(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        let onComplete = this.algosdk.OnApplicationComplete.UpdateApplicationOC;
        const compiledResult = await this.algodClient.compile(this.approvalProgData).do();
        const compiledClearResult = await this.algodClient.compile(this.clearProgData).do();
        const compiledResultUint8 = new Uint8Array(Buffer.from(compiledResult.result, "base64"));
        const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledClearResult.result, "base64"));
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Main Contract Hash = %s", compiledResult.hash);
        //this.logger.info("AlgoPoaP Main Contract Result = %s", compiledResult.result)
        this.logger.info("AlgoPoaP Clear Hash = %s", compiledClearResult.hash);
        //this.logger.info("AlgoPoaP Clear Result = %s", compiledClearResult.result);
        /* let note = this.algosdk.encodeObj(
              `Update AlgoPoaP Application ID: ${this.applicationId}`
          ); */

        let appTxn = this.algosdk.makeApplicationUpdateTxn(addr, params, Number(this.applicationId),
            compiledResultUint8, compiledClearResultUint8);
        let appTxnId = appTxn.txID().toString();
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Main Application Update TXId =  %s", appTxnId);
        let signedAppTxn = appTxn.signTxn(acc.sk);
        await this.algodClient.sendRawTransaction(signedAppTxn).do();
        await this.algosdk.waitForConfirmation(this.algodClient, appTxnId, 5)
        //await waitForConfirmation(appTxnId);
        let transactionResponse = await this.algodClient.pendingTransactionInformation(appTxnId).do();

        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Updated Main Application ID: %s", this.applicationId);
        this.logger.info('------------------------------')

        this.applicationAddr = this.algosdk.getApplicationAddress(Number(this.applicationId));
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Updated Main Application Address: %s", this.applicationAddr);
        this.logger.info('------------------------------')
    }
    getMethodByName(name, contract) {
        const m = contract.methods.find((mt) => { return mt.name == name })
        if (m === undefined)
            throw Error("Method undefined: " + name)
        return m
    }
    async setupMainContract(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(acc)

        const contract = new this.algosdk.ABIContract(JSON.parse(this.contract.toString()))
        const commonParams = {
            appID: Number(this.applicationId),
            sender: acc.addr,
            suggestedParams: params,
            signer: signer
        }
        let method = this.getMethodByName("setup", contract)
        atc.addMethodCall({
            method: method,
            methodArgs: [this.config.deployer.version],
            ...commonParams
        })
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Main Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 2)
        for (const idx in result.methodResults) {
            let buff = Buffer.from(result.methodResults[idx].rawReturnValue, "base64")
            let res = buff.slice(2, buff.byteLength).toString()
            this.logger.info("AlgoPoaP Main Contract ABI Exec method result = %s", res);


        }
    }
    async getMainMetrics(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(acc)

        const contract = new this.algosdk.ABIContract(JSON.parse(this.contract.toString()))
        const commonParams = {
            appID: Number(this.applicationId),
            sender: acc.addr,
            suggestedParams: params,
            signer: signer
        }
        let method = this.getMethodByName("get_metrics", contract)
        atc.addMethodCall({
            method: method,
            methodArgs: [],
            ...commonParams
        })
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Main Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 2)
        for (const idx in result.methodResults) {
            let buff = Buffer.from(result.methodResults[idx].rawReturnValue, "base64")
            let res = buff.toString()
            this.logger.info("AlgoPoaP Main Contract ABI Exec method result = %s", res);


        }
    }
    async getMainMetric(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(acc)

        const contract = new this.algosdk.ABIContract(JSON.parse(this.contract.toString()))
        const commonParams = {
            appID: Number(this.applicationId),
            sender: acc.addr,
            suggestedParams: params,
            signer: signer
        }
        let method = this.getMethodByName("get_metric", contract)
        atc.addMethodCall({
            method: method,
            methodArgs: ['poap_count'],
            ...commonParams
        })
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Main Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 2)
        for (const idx in result.methodResults) {
            let buff = Buffer.from(result.methodResults[idx].rawReturnValue, "base64")
            let res = buff.toString()
            this.logger.info("AlgoPoaP Main Contract ABI Exec method result = %s", res);


        }
    }
    async deployItemContract(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(acc)


        const compiledItemResult = await this.algodClient.compile(this.itemApprovalProgData).do();
        const compiledItemClearResult = await this.algodClient.compile(this.itemClearProgData).do();
        const compiledResultUint8 = new Uint8Array(Buffer.from(compiledItemResult.result, "base64"));
        const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledItemClearResult.result, "base64"));
        const contract = new this.algosdk.ABIContract(JSON.parse(this.contract.toString()))
        const commonParams = {
            appID: Number(this.applicationId),
            sender: acc.addr,
            suggestedParams: params,
            signer: signer,
        }
        let method = this.getMethodByName("item_create", contract)

        const ptxn = new this.algosdk.Transaction({
            from: acc.addr,
            to: this.applicationAddr,
            amount: 2 * params.fee,
            fee: params.fee,
            ...params
        })

        const tws = { txn: ptxn, signer: signer }

        atc.addMethodCall({
            method: method,
            methodArgs: [tws, compiledResultUint8, compiledClearResultUint8],
            ...commonParams
        })
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Main Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 2)
        for (let idx in result.methodResults) {

            let res = this.algosdk.decodeUint64(result.methodResults[idx].rawReturnValue)
            this.logger.info("AlgoPoaP Main Contract ABI Exec method result = %s", res);


        }
    }
    async updateItemContract(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(acc)


        const compiledItemResult = await this.algodClient.compile(this.itemApprovalProgData).do();
        const compiledItemClearResult = await this.algodClient.compile(this.itemClearProgData).do();
        const compiledResultUint8 = new Uint8Array(Buffer.from(compiledItemResult.result, "base64"));
        const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledItemClearResult.result, "base64"));
        const contract = new this.algosdk.ABIContract(JSON.parse(this.contract.toString()))
        const commonParams = {
            appID: Number(this.applicationId),
            sender: acc.addr,
            suggestedParams: params,
            signer: signer,
        }
        let method = this.getMethodByName("item_update", contract)

        let application = Number(this.applicationItemId)
        atc.addMethodCall({
            method: method,
            methodArgs: [application, compiledResultUint8, compiledClearResultUint8],
            ...commonParams
        })
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Main Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 2)
        for (const idx in result.methodResults) {

            let res = this.algosdk.decodeUint64(result.methodResults[idx].rawReturnValue)
            this.logger.info("AlgoPoaP Main Contract ABI Exec method result = %s", res);


        }
    }
    async deleteItemContract(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(acc)



        const contract = new this.algosdk.ABIContract(JSON.parse(this.contract.toString()))
        const commonParams = {
            appID: Number(this.applicationId),
            sender: acc.addr,
            suggestedParams: params,
            signer: signer
        }
        let method = this.getMethodByName("item_delete", contract)


        atc.addMethodCall({
            method: method,
            methodArgs: [this.applicationItemId],
            ...commonParams
        })
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Main Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 2)
        for (const idx in result.methodResults) {


            this.logger.info("AlgoPoaP Main Contract ABI Exec method result: void");


        }
    }
    async setupItemContract(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(acc)
        const contract = new this.algosdk.ABIContract(JSON.parse(this.itemContract.toString()))
        const commonParams = {
            appID: Number(Number(this.applicationItemId)),
            sender: acc.addr,
            suggestedParams: params,
            signer: signer
        }
        const ptxn = new this.algosdk.Transaction({
            from: acc.addr,
            to: this.applicationAddr,
            amount: 3 * params.fee,
            fee: 2 * params.fee,

            ...params
        })

        const tws = { txn: ptxn, signer: signer }
        let method = this.getMethodByName("setup", contract)


        atc.addMethodCall({
            method: method,
            methodArgs: [tws, addr, Number(this.applicationId), '-', 'poap_name', 'poap_logo', 'poap_desc', 'poap_timezone', 'poap_address', 'poap_url', 'poap_email', [1661863665, 30, 3232, 100, 2345, 150, 3, 1, 1, 1, 1, 6, 1]],
            ...commonParams
        })
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Item Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 2)
        for (const idx in result.methodResults) {

            let res = this.algosdk.decodeUint64(result.methodResults[idx].rawReturnValue)
            this.logger.info("AlgoPoaP Item Contract ABI Exec method result = %s", res);


        }
    }
    async reSetupItemContract(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(acc)

        const contract = new this.algosdk.ABIContract(JSON.parse(this.itemContract.toString()))
        const commonParams = {
            appID: Number(Number(this.applicationItemId)),
            sender: acc.addr,
            suggestedParams: params,
            signer: signer
        }
        const ptxn = new this.algosdk.Transaction({
            from: acc.addr,
            to: this.applicationAddr,
            amount: params.fee,
            fee: params.fee,
            ...params
        })

        const tws = { txn: ptxn, signer: signer }
        let method = this.getMethodByName("re_setup", contract)

        atc.addMethodCall({
            method: method,
            methodArgs: [tws, addr, Number(this.applicationId), Number(this.itemAsaId), 'poap_name', 'poap_logo', 'poap_desc', 'poap_timezone', 'poap_address', 'poap_url', 'poap_email', [1661863665, 30, 3232, 100, 2345, 150, 3, 1, 1, 1, 1, 6, 1]],
            ...commonParams
        })
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Item Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 2)
        for (const idx in result.methodResults) {

            let res = this.algosdk.decodeUint64(result.methodResults[idx].rawReturnValue)
            this.logger.info("AlgoPoaP Item Contract ABI Exec method result = %s", res);


        }
    }
    async activateItemContract(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(acc)

        const contract = new this.algosdk.ABIContract(JSON.parse(this.itemContract.toString()))
        const commonParams = {
            appID: Number(Number(this.applicationItemId)),
            sender: acc.addr,
            suggestedParams: params,
            signer: signer
        }
        let attendees_qty = 3
        const ptxn = new this.algosdk.Transaction({
            type: 'pay',
            from: acc.addr,
            to: this.applicationAddr,
            amount: attendees_qty * 4 * params.fee,
            fee: params.fee,
            ...params
        })
        const atxn = new this.algosdk.Transaction({
            type: 'axfer',
            from: acc.addr,
            to: acc.addr,
            assetIndex: Number(this.itemAsaId),
            amount: 0,
            fee: 2 * params.fee,
            ...params
        })

        const tws0 = { txn: ptxn, signer: signer }
        const tws1 = { txn: atxn, signer: signer }
        let method = this.getMethodByName("activate", contract)

        atc.addMethodCall({
            method: method,
            methodArgs: [tws0, tws1, Number(this.applicationId), Number(this.itemAsaId)],
            ...commonParams
        })
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Item Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 2)
        for (const idx in result.methodResults) {

            let buff = Buffer.from(result.methodResults[idx].rawReturnValue, "base64")
            let res = buff.toString()
            this.logger.info("AlgoPoaP Item Contract ABI Exec method result = %s", res);


        }
    }
    async releaseItemContract(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(acc)

        const contract = new this.algosdk.ABIContract(JSON.parse(this.itemContract.toString()))
        const commonParams = {
            appID: Number(Number(this.applicationItemId)),
            sender: acc.addr,
            suggestedParams: params,
            signer: signer
        }



        let method = this.getMethodByName("release", contract)

        atc.addMethodCall({
            method: method,
            methodArgs: [Number(this.applicationId)],
            ...commonParams
        })
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Item Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 2)
        for (const idx in result.methodResults) {

            let buff = Buffer.from(result.methodResults[idx].rawReturnValue, "base64")
            let res = buff.toString()
            this.logger.info("AlgoPoaP Item Contract ABI Exec method result = %s", res);


        }
    }
    async claimItemContract(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(acc)

        const contract = new this.algosdk.ABIContract(JSON.parse(this.itemContract.toString()))
        const commonParams = {
            appID: Number(Number(this.applicationItemId)),
            sender: acc.addr,
            suggestedParams: params,
            signer: signer
        }
        const ptxn = new this.algosdk.Transaction({
            type: 'pay',
            from: acc.addr,
            to: this.applicationAddr,
            amount: 0,
            fee: params.fee,
            ...params
        })

        const tws0 = { txn: ptxn, signer: signer }
        let method = this.getMethodByName("claim", contract)
        let method_budget_1 = this.getMethodByName("budget_increase_call_1", contract)
        let method_budget_2 = this.getMethodByName("budget_increase_call_2", contract)
        let method_budget_3 = this.getMethodByName("budget_increase_call_3", contract)
        let note_claim = this.algosdk.encodeObj(
            "AlgoPoaP Claim Transaction"
        );

        //let oncomplete = this.algosdk.OnApplicationComplete.NoOpOC
        /*     let sigTxn = this.algosdk.makeApplicationCallTxnFromObject({
                appIndex:Number(this.applicationItemId),
                suggestedParams: params,
                from: acc.addr,
                fee: params.fee,
                note: note,
                onComplete: oncomplete,
            }) */
        //const tws1 = { txn: sigTxn, signer: signer }
        atc.addMethodCall({
            method: method_budget_1,
            methodArgs: [],
            ...commonParams
        })
        atc.addMethodCall({
            method: method_budget_2,
            methodArgs: [],
            ...commonParams
        })
        atc.addMethodCall({
            method: method_budget_3,
            methodArgs: [],
            ...commonParams
        })
        //const compiledResult = await this.algodClient.compile(this.itemApprovalProgData).do();
        //const compiledClearResult = await this.algodClient.compile(this.clearProgData).do();

        let rawDataString = "secret test string"
        let rawData = Buffer.from(rawDataString).toString('base64')//this.algosdk.encodeObj(rawDataString)//"secret test string"//Buffer.from("secret test string").toString('base64')
        let appAddr = this.algosdk.getApplicationAddress(Number(this.applicationItemId))
        let sig = this.algosdk.tealSign(acc.sk, rawData,appAddr)
        let sigBase64 = Buffer.from(sig).toString('base64')
        let pk = this.algosdk.decodeAddress(acc.addr).publicKey
        let signedBytes = this.algosdk.signBytes(rawData, acc.sk)
        let verify = this.algosdk.verifyBytes(rawData, signedBytes, acc.addr)
        console.log(verify)

        atc.addMethodCall({
            method: method,
            note: note_claim,
            methodArgs: [tws0, Number(this.itemAsaId), Number(this.applicationId), pk/* acc.addr */, sig/* signedBytes */, rawData, [30, 3232, 100, 2345, 1671942604]],
            ...commonParams
        })

        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Item Contract ABI Exec method = %s", method);


        const result = await atc.execute(this.algodClient, 2)
        for (const idx in result.methodResults) {

            let buff = Buffer.from(result.methodResults[idx].rawReturnValue, "base64")
            let res = buff.toString()
            this.logger.info("AlgoPoaP Item Contract ABI Exec method result = %s", res);


        }
    }
    async closeOutMainContract(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        let appTxn = this.algosdk.makeApplicationCloseOutTxn(addr, params, Number(this.applicationId));
        let appTxnId = appTxn.txID().toString();
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Main Application close out TXId =  %s", appTxnId);
        let signedAppTxn = appTxn.signTxn(acc.sk);
        await this.algodClient.sendRawTransaction(signedAppTxn).do();
        await this.algosdk.waitForConfirmation(this.algodClient, appTxnId, 5)
        this.logger.info('------------------------------')


    }
    async closeOutItemContract(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        let appTxnItem = this.algosdk.makeApplicationCloseOutTxn(addr, params, Number(this.applicationItemId));
        let appTxnIdItem = appTxnItem.txID().toString();
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Item Application close out TXId =  %s", appTxnIdItem);
        let signedAppTxnItem = appTxnItem.signTxn(acc.sk);
        await this.algodClient.sendRawTransaction(signedAppTxnItem).do();
        await this.algosdk.waitForConfirmation(this.algodClient, appTxnIdItem, 5)
        this.logger.info('------------------------------')


    }
    async optinMainContract(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        let appTxn = this.algosdk.makeApplicationOptInTxn(addr, params, Number(this.applicationId));
        let appTxnId = appTxn.txID().toString();
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Main Application Optin TXId =  %s", appTxnId);
        let signedAppTxn = appTxn.signTxn(acc.sk);
        await this.algodClient.sendRawTransaction(signedAppTxn).do();
        await this.algosdk.waitForConfirmation(this.algodClient, appTxnId, 5)
        this.logger.info('------------------------------')


    }
    async optinItemContract(addr, acc) {
        let params = await this.algodClient.getTransactionParams().do();
        let appTxnItem = this.algosdk.makeApplicationOptInTxn(addr, params, Number(this.applicationItemId));
        let appTxnIdItem = appTxnItem.txID().toString();
        this.logger.info('------------------------------')
        this.logger.info("AlgoPoaP Item Application Optin TXId =  %s", appTxnIdItem);
        let signedAppTxnItem = appTxnItem.signTxn(acc.sk);
        await this.algodClient.sendRawTransaction(signedAppTxnItem).do();
        await this.algosdk.waitForConfirmation(this.algodClient, appTxnIdItem, 5)
        this.logger.info('------------------------------')


    }
    async deployerAccount() {

        try {
            const account = await this.importAccount();
            this.accountObject = account
            this.accountAddress = account.addr;
        }
        catch (err) {
            this.logger.error(err);
        }

    }
    async deployerReport() {

        try {
            await this.fetchAlgoWalletInfo();
            await this.printCreatedAsset();
            await this.printAssetHolding(this.accountObject.addr);
        }
        catch (err) {
            this.logger.error(err);
        }

    }
    async deleteApps(appsTodelete) {
        let wallet = this.config.algorand.algo_wallet_address
        let apps = appsTodelete || []
        for (let i = 0; i < apps.length; i++) {
            this.logger.info('Now deleting AlgoPoaP APP: %s', apps[i])
            let params = await this.algodClient.getTransactionParams().do();
            params.fee = 1000;
            params.flatFee = true;
            let sender = wallet;
            let revocationTarget = undefined;
            let closeRemainderTo = undefined;

            let note = this.algosdk.encodeObj(
                JSON.stringify({
                    system: "Deleting AlgoPoaP main app",
                    date: `${new Date()}`,
                })
            );
            let txn = this.algosdk.makeApplicationDeleteTxnFromObject({
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
            const signedTxn = txn.signTxn(this.accountObject.sk);
            const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();
            await this.algosdk.waitForConfirmation(this.algodClient, txId, 5)
            //await waitForConfirmation(txId);
            let ptx = await this.algodClient.pendingTransactionInformation(txId).do();
            const noteArrayFromTxn = ptx.txn.txn.note;
            const receivedNote = Buffer.from(noteArrayFromTxn).toString('utf8');
            this.logger.info("Note from confirmed AlgoPoaP Delete TXN: %s", receivedNote);
        }

    }
    async createGeoIndex() {
        let geoIndex = []
        for (i = 0; i < 90; i++) {
            let lat = i
            let lng1 = 0
            let lng2 = 0.0001
            geoIndex.push({
                lat,
                //lng1,
                //lng2,
                distance: geolib.getDistance(
                    { latitude: lat, longitude: lng1 },
                    { latitude: lat, longitude: lng2 }
                ),

            })
        }
        let utilArray = [];
        let geoIndexDistinct = []
        geoIndex.forEach((item) => {
            if (utilArray.indexOf(item.distance) === -1) {
                utilArray.push(item.distance)
                geoIndexDistinct.push(item)
            }


        })
        const fileContent = JSON.stringify(geoIndexDistinct, null, 2);
        fs.writeFileSync("geoindex.json", fileContent);
        this.geoIndex = geoIndexDistinct;

    }
    async runDeployer() {
        await this.deployerAccount()
        if (this.config.deployer['deployer_report']) await this.deployerReport();
        if (this.config.deployer['delete_apps']) await this.deleteApps(this.config.deployer.apps_to_delete);
        if (this.config.deployer['create_geo_index']) {
            {
                try {

                    await this.createGeoIndex();
                }
                catch (err) {
                    this.logger.error(err);
                }
            }
        }
        if (this.config.deployer['deployer_contracts']) {
            try {
                await this.deployMainContract(this.accountObject.addr, this.accountObject);
            }
            catch (err) {
                this.logger.error(err);
            }
        }
        if (this.config.deployer['deployer_update_contracts']) {
            {
                try {
                    await this.updateMainContract(this.accountObject.addr, this.accountObject);
                }
                catch (err) {
                    this.logger.error(err);
                }
            }
        }
        if (this.config.deployer['setup_app']) {
            {
                try {
                    await this.setupMainContract(this.accountObject.addr, this.accountObject);
                }
                catch (err) {
                    this.logger.error(err);
                }
            }
        }
        if (this.config.deployer['test_metrics']) {
            {
                try {
                    await this.getMainMetrics(this.accountObject.addr, this.accountObject);
                    await this.getMainMetric(this.accountObject.addr, this.accountObject);
                }
                catch (err) {
                    this.logger.error(err);
                }
            }
        }
        if (this.config.deployer['test_item_closeout']) {
            {
                try {
                    await this.closeOutItemContract(this.accountObject.addr, this.accountObject);
                }
                catch (err) {
                    this.logger.error(err);
                }
            }
        }
        if (this.config.deployer['test_main_optin']) {
            {
                try {
                    await this.optinMainContract(this.accountObject.addr, this.accountObject);
                }
                catch (err) {
                    this.logger.error(err);
                }
            }
        }
        if (this.config.deployer['test_item_create']) {
            {
                try {
                    await this.deployItemContract(this.accountObject.addr, this.accountObject);
                }
                catch (err) {
                    this.logger.error(err);
                }
            }
        }
        if (this.config.deployer['test_item_update']) {
            {
                try {
                    await this.updateItemContract(this.accountObject.addr, this.accountObject);
                }
                catch (err) {
                    this.logger.error(err);
                }
            }
        }
        if (this.config.deployer['test_main_closeout']) {
            {
                try {
                    await this.closeOutMainContract(this.accountObject.addr, this.accountObject);
                }
                catch (err) {
                    this.logger.error(err);
                }
            }
        }
        if (this.config.deployer['test_item_optin']) {
            {
                try {
                    await this.optinItemContract(this.accountObject.addr, this.accountObject);
                }
                catch (err) {
                    this.logger.error(err);
                }
            }
        }
        if (this.config.deployer['test_item_delete']) {
            {
                try {
                    await this.deleteItemContract(this.accountObject.addr, this.accountObject);
                }
                catch (err) {
                    this.logger.error(err);
                }
            }
        }
        if (this.config.deployer['test_item_setup']) {
            {
                try {
                    if (Number(this.itemAsaId) > 0) {
                        await this.reSetupItemContract(this.accountObject.addr, this.accountObject);
                    } else {
                        await this.setupItemContract(this.accountObject.addr, this.accountObject);
                    }
                }
                catch (err) {
                    this.logger.error(err);
                }
            }
        }
        if (this.config.deployer['test_item_activate']) {
            {
                try {
                    await this.activateItemContract(this.accountObject.addr, this.accountObject);
                }
                catch (err) {
                    this.logger.error(err);
                }
            }
        }
        if (this.config.deployer['test_item_release']) {
            {
                try {
                    await this.releaseItemContract(this.accountObject.addr, this.accountObject);
                }
                catch (err) {
                    this.logger.error(err);
                }
            }
        }
        if (this.config.deployer['test_item_claim']) {
            {
                try {
                    await this.claimItemContract(this.accountObject.addr, this.accountObject);
                }
                catch (err) {
                    this.logger.error(err);
                }
            }
        }

        process.exit();
    }
}

module.exports = AlgoPoapDeployer