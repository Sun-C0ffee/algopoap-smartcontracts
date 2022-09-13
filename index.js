const algosdk = require('algosdk');
const fs = require('fs')
const path = require('path');
const config = require('./config.json');
const logger = require('./logger');
const AlgoPoapDeployer = require('./algopoap-deployer')
let props = {}
props.mnemonic = fs.readFileSync(path.join(__dirname, 'algopoap_mnemonic.txt'), 'utf8')


props.config = config
props.algosdk = algosdk
props.logger = logger
props.approvalProgData =  fs.readFileSync(path.join(__dirname, 'algopoap-main.teal'))
props.clearProgData =  fs.readFileSync(path.join(__dirname, 'algopoap-clear.teal'))
props.itemApprovalProgData =  fs.readFileSync(path.join(__dirname, 'algopoap-item.teal'));
props.itemClearProgData =  fs.readFileSync(path.join(__dirname, 'algopoap-clear.teal'));
props.contract =  fs.readFileSync(path.join(__dirname, 'algopoap-contract.json'));
props.itemContract =  fs.readFileSync(path.join(__dirname, 'algopoap-item-contract.json'));
const algoPoapDeployer = new AlgoPoapDeployer(props)
algoPoapDeployer.runDeployer()