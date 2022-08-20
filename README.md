![](https://avatars.githubusercontent.com/u/106061767?s=96&v=4)
# AlgoPoaP Smart Contracts 
**This repository contains SmartContracts for AlgoPoaP dApp on Algorand.**

[AlgoPoaP's Frontend Repository](https://github.com/AlgoPoaP/algopoap)

AlgoPoaP ASC System is designed on basis of newest TEAL features came with TEAL v 6.0 on AVM V1.1. AlgoPoaP Parent contract is created and thereafter every AlgoPoaP item is created by this parent contract based on configurations needed.


----
### Entities Relations:

```mermaid
  graph TD;
      AlgoPoaP_Service== manages ==>Parent_AlgoPoaP_ASC;
      Parent_AlgoPoaP_ASC== manages ==>AlgoPoaP_item_ASC;
      
      AlgoPoaP_Attendee== interacts ==>AlgoPoaP_item_ASC;
      AlgoPoaP_Author== interacts ==>Parent_AlgoPoaP_ASC;
      AlgoPoaP_Author== interacts ==>AlgoPoaP_item_ASC;
```

----

### Lifecycle:

```mermaid
  stateDiagram-v2
    [*] --> AlgoPoaP_Service
    AlgoPoaP_Service --> Parent_AlgoPoaP_ASC
    Parent_AlgoPoaP_ASC --> AlgoPoaP_item_ASC
    AlgoPoaP_item_ASC --> close
    Parent_AlgoPoaP_ASC --> eol
    close --> archive
    eol --> archive
    archive --> [*]
```
----



### UseCase:

```mermaid
  flowchart TB

    id1([Author]) --uses--> parentMethodCalls
    id1([Author]) --uses--> parentAppCalls
    id1([Author]) --uses--> itemMethodCalls
    

    id2([Attendee]) --uses--> parentAppCalls 
    id2([Attendee]) --uses--> itemMethodCalls 
  

    subgraph AlgoPoaP
      
      subgraph parentASC
        subgraph parentAppCalls
        id3([create]) 
        id4([update]) 
        id5([delete]) 
        id6([setup]) 
        id6([optin]) 
        id7([closeout]) 
        end
        subgraph parentMethodCalls
        id8([create]) 
        id9([update]) 
        id10([delete]) 
        id11([get_metrics]) 
        end
      end
      subgraph itemASC
        
        
        subgraph itemAppCalls
        id12([optin])
        id13([create]) 
        id14([update]) 
        id15([delete]) 
        id16([setup]) 
        id17([closeout]) 
        end
        subgraph itemMethodCalls
        id18([activate]) 
        id19([claim]) 
        id20([release]) 
        id21([get_metrics]) 
        end
      end
      
    end 
   
    
    

```
----

### AlgoPoaP ASC TEAL Graph:

```mermaid
  stateDiagram-v2
    [*] --> b_main
    b_main --> sub_general_checks
    sub_general_checks --> b_main
    b_main --> b_on_completion
    b_on_completion --> b_creation
    b_creation --> Log_and_Return
    b_on_completion --> b_optin
    b_optin --> Log_and_Return
    b_on_completion --> b_deletion
    b_deletion --> Log_and_Return
    b_on_completion --> b_update
    b_update --> Log_and_Return
    b_on_completion --> b_closeout
    b_closeout --> Log_and_Return

    b_on_completion --> b_noop
    b_noop --> sub_setup
    sub_setup --> b_noop
    b_noop --> Log_and_Return

    abi_methods --> c2c_create
    c2c_create --> Log_and_Return
    abi_methods --> c2c_delete
    c2c_delete --> Log_and_Return
    abi_methods --> c2c_update
    c2c_update --> Log_and_Return

   
    abi_methods --> get_metrics
    get_metrics --> sub_metrics_update
    sub_metrics_update --> get_metrics
    get_metrics --> Log_and_Return

    abi_methods --> get_metric
    get_metric --> sub_metric_update
    sub_metric_update --> get_metric
    get_metric --> Log_and_Return

    Log_and_Return --> [*]
    
```
----

### AlgoPoaP ASC ABI :

Note 1: Data fields are global states of AlgoPoaP parent smart contract.

Note 2: Fee collection is not included anywhere at this phase of AlgoPoaP MVP development but certainly is a priority prior to public TESTNET deployment. It happens on parent smart contract.

```mermaid
  classDiagram
    class AlgoPoaP_ASC
    AlgoPoaP_ASC : +Uint64 poap_onboard_count
    AlgoPoaP_ASC : +Uint64 poap_count
    AlgoPoaP_ASC : +Uint64 poap_txn_count
    AlgoPoaP_ASC : +Uint64 poap_claim_count
    AlgoPoaP_ASC : +Uint64 poap_issuance_count
    AlgoPoaP_ASC : +Uint64 poap_nft_issuance_count
    AlgoPoaP_ASC : +Uint64 poap_txn_issuance_count

    AlgoPoaP_ASC : +Uint64 poap_geo_check_count
    AlgoPoaP_ASC : +Uint64 poap_qr_check_count
    AlgoPoaP_ASC : +Uint64 poap_sig_check_count

    AlgoPoaP_ASC : +Uint64 poap_author_count
    AlgoPoaP_ASC : +Uint64 poap_attendee_count
    AlgoPoaP_ASC : +Byte poap_last_appid
    AlgoPoaP_ASC : +Byte poap_last_author
    AlgoPoaP_ASC : +Byte poap_last_attendee
    AlgoPoaP_ASC : +create(pay,byte[],byte[])uint64
    AlgoPoaP_ASC : +update(application,byte[],byte[])bool
    AlgoPoaP_ASC : +delete(application)bool
    AlgoPoaP_ASC : +get_metrics()byte[]
    AlgoPoaP_ASC : +get_metric(string)byte[]
    
```
Note 1: Author has all metrics in localState of AlgoPoaP Item smart contract and all Authored AlgoPoaPs (upt to 16 item) in localState of AlgoPoaP smart contract (parent) 

----

### AlgoPoaP ASC ABI Schema :
```js
{
    "name":"algopoap-contract",
    "desc": "AlgoPoaP Parent smart contract",
    "networks":{
        "MainNet":{
            "appID": 0
        },
        "TestNet":{
            "appID": 0
        }
    },
    "methods":[
        {
            "name": "create",
            "args": [
              {
                "type": "pay",
                "name": "pay"
              },
              {
                "type": "byte[]",
                "name": "asc_approval_bytes"
              },
              {
                "type": "byte[]",
                "name": "asc_clear_bytes"
              }
            ],
            "returns": {
              "type": "uint64"
            },
            "desc": "Creates a new AlgoPoaP item smartcontract and returns the app id"
          },
          {
            "name": "update",
            "args": [
              {
                "type": "application",
                "name": "application"
              },
              {
                "type": "byte[]",
                "name": "asc_approval_bytes"
              },
              {
                "type": "byte[]",
                "name": "asc_clear_bytes"
              }
            ],
            "returns": {
              "type": "bool"
            },
            "desc": "Updates an AlgoPoaP item smartcontract and returns bool (true on success)"
          },
          {
            "name": "delete",
            "args": [
              {
                "type": "application",
                "name": "application"
              }
            ],
            "returns": {
              "type": "bool"
            },
            "desc": "Deletes an AlgoPoaP item smartcontract and returns bool (true on success)"
          },
          {
            "name": "get_metric",
            "args": [
              {
                "type": "string",
                "name": "metric_signature"
              }
            ],
            "returns": {
              "type": "byte[]"
            },
            "desc": "Gets an specific metric by signature string"
          },
          {
            "name": "get_metrics",
            "args": [],
            "returns": {
              "type": "byte[]"
            },
            "desc": "Gets an specific metric by signature string"
          }
    ]
}

```
----

### AlgoPoaP Item ASC TEAL Graph:

```mermaid
  stateDiagram-v2
    [*] --> b_main
    b_main --> sub_general_checks
    sub_general_checks --> b_main
    b_main --> b_on_completion
    
    b_on_completion --> b_creation
    b_creation --> Log_and_Return
    b_on_completion --> b_optin
    b_optin --> Log_and_Return
    b_on_completion --> b_deletion
    b_deletion --> Log_and_Return
    b_on_completion --> b_update
    b_update --> Log_and_Return
    b_on_completion --> b_closeout
    b_closeout --> Log_and_Return

    b_on_completion --> b_noop
    b_noop --> sub_setup
    sub_setup --> sub_nft_create
    sub_nft_create --> sub_setup
    sub_setup --> b_noop
    b_noop --> Log_and_Return
   


    abi_methods --> activate
    activate --> Log_and_Return

    abi_methods --> release
    release --> Log_and_Return

    abi_methods --> claim
    claim --> sub_geo
    sub_geo --> claim
    claim --> sub_time
    sub_time --> claim
    claim --> sub_qr
    sub_qr --> claim
    claim --> sub_sig
    sub_sig --> claim
    claim --> sub_nft_send
    sub_nft_send --> claim
    claim --> Log_and_Return


    
  
    abi_methods --> get_metrics
    get_metrics --> Log_and_Return
  
    
    Log_and_Return --> [*]
    
```
----

### AlgoPoaP ASC ITEM ABI :

Note 1: Data fields are global states of AlgoPoaP item smart contract.

```mermaid
  classDiagram
    class AlgoPoaP_ASC_ITEM
    AlgoPoaP_ASC_ITEM : +Uint64 poap_item_onboard_count
    AlgoPoaP_ASC_ITEM : +Uint64 poap_item_txn_count
    AlgoPoaP_ASC_ITEM : +Uint64 poap_item_apply_count
    AlgoPoaP_ASC_ITEM : +Uint64 poap_item_issuance_count
    AlgoPoaP_ASC_ITEM : +Uint64 poap_item_nft_issuance_count
    AlgoPoaP_ASC_ITEM : +Uint64 poap_item_txn_issuance_count

    AlgoPoaP_ASC_ITEM : +Uint64 poap_item_geo_check_count
    AlgoPoaP_ASC_ITEM : +Uint64 poap_item_qr_check_count
    AlgoPoaP_ASC_ITEM : +Uint64 poap_item_sig_check_count

    AlgoPoaP_ASC_ITEM : +Uint64 poap_item_attendee_count
    AlgoPoaP_ASC_ITEM : +Byte poap_item_last_attendee
    AlgoPoaP_ASC_ITEM : +Byte poap_item_last_apply
    AlgoPoaP_ASC_ITEM : +Byte poap_item_last_issuance
    AlgoPoaP_ASC_ITEM : +Byte poap_item_last_nft_issuance
    AlgoPoaP_ASC_ITEM : +Byte poap_item_last_txn_issuance
    AlgoPoaP_ASC_ITEM : +activate(appl,pay,axfer)byte[]
    AlgoPoaP_ASC_ITEM : +claim(appl,pay,axfer,account,uint16,uint48,uint24,uint48,uint24,uint64,string)string
    AlgoPoaP_ASC_ITEM : +release(appl)byte[]
    AlgoPoaP_ASC_ITEM : +get_metric(string)byte[]
    AlgoPoaP_ASC_ITEM : +get_metrics()byte[]
    
  
    
```

----

### AlgoPoaP ASC ITEM ABI Schema :
```js
{
    "name": "algopoap-item-contract",
    "desc": "AlgoPoaP Item smart contract",
    "networks": {
        "MainNet": {
            "appID": 0
        },
        "TestNet": {
            "appID": 0
        }
    },
    "methods": [
        {
            "name": "activate",
            "args": [
                {
                    "type": "appl",
                    "name": "parent_call"
                },
                {
                    "type": "pay",
                    "name": "pay_min_fees"
                },
                {
                    "type": "axfer",
                    "name": "optin_algopoap_nft"
                }
            ],
            "returns": {
                "type": "byte[]"
            },
            "desc": "Activates an AlgoPoaP item smart contract and returns all metrics"
        },
        {
            "name": "claim",
            "args": [
                {
                    "type": "appl",
                    "name": "parent_call"
                },
                {
                    "type": "pay",
                    "name": "pay_min_fee"
                },
                {
                    "type": "axfer",
                    "name": "optin_algopoap_nft"
                },
                
                {
                    "type": "account",
                    "name": "attendee_account"
                },
                {
                    "type": "uint16",
                    "name": "lat_1"
                },
                {
                    "type": "uint48",
                    "name": "lat_2"
                },
                {
                    "type": "uint24",
                    "name": "lng_1"
                },
                {
                    "type": "uint48",
                    "name": "lng_2"
                },
                {
                    "type": "uint24",
                    "name": "geo_buffer"
                },
                {
                    "type": "uint64",
                    "name": "timestamp"
                },
                {
                    "type": "string",
                    "name": "qr_secret"
                }
                
            ],
            "returns": {
                "type": "string"
            },
            "desc": "Claims an AlgoPoaP for an attendee and returns NFT sending inner-transaction hash"
        },
        {
            "name": "release",
            "args": [
                {
                    "type": "appl",
                    "name": "parent_call"
                }
            ],
            "returns": {
                "type": "byte[]"
            },
            "desc": "Releases AlgoPoaP and allows all AlgoPoaP attendee's to start claiming"
        },
        {
            "name": "get_metric",
            "args": [
                {
                    "type": "string",
                    "name": "metric_signature"
                }
            ],
            "returns": {
                "type": "byte[]"
            },
            "desc": "Gets an specific metric by signature string"
        },
        {
            "name": "get_metrics",
            "args": [],
            "returns": {
                "type": "byte[]"
            },
            "desc": "Gets an specific metric by signature string"
        }
    ]
}

```
----



Since AlgoPoaP is totally decentralized, trustless and permission-less: Every AlgoPoaP item author has full authority of the created PoaPs (AlgoPoaP-DAO is coming with dao, voting and governance features in near future, after startup formation. Preferably I will use integration to an already working service with ABI)!

The algopoap_contract.json contains the ABI Schema for parent AlgoPoaP contract and algopoap_item_contract.json is the full ABI Schema of AlgoPoaP item contract which will be created by an C2C call via an inner transaction.






```js
{
    "name": "algopoap-item-contract",
    "desc": "AlgoPoaP Item smart contract",
    "networks": {
        "MainNet": {
            "appID": 0
        },
        "TestNet": {
            "appID": 0
        }
    },
    "methods": [
        {
            "name": "activate",
            "args": [
                {
                    "type": "appl",
                    "name": "parent_call"
                },
                {
                    "type": "pay",
                    "name": "pay"
                }
            ],
            "returns": {
                "type": "byte[]"
            },
            "desc": "Activates an AlgoPoaP item smart contract and returns all metrics"
        },
        {
            "name": "claim",
            "args": [
                {
                    "type": "appl",
                    "name": "parent_call"
                },
                {
                    "type": "pay",
                    "name": "pay"
                },
                {
                    "type": "account",
                    "name": "attendee_account"
                },
                {
                    "type": "uint16",
                    "name": "lat_1"
                },
                {
                    "type": "uint48",
                    "name": "lat_2"
                },
                {
                    "type": "uint24",
                    "name": "lng_1"
                },
                {
                    "type": "uint48",
                    "name": "lng_2"
                },
                {
                    "type": "uint24",
                    "name": "geo_buffer"
                },
                {
                    "type": "uint64",
                    "name": "timestamp"
                },
                {
                    "type": "string",
                    "name": "qr_secret"
                }
                
            ],
            "returns": {
                "type": "string"
            },
            "desc": "Claims an AlgoPoaP for an attendee and returns NFT sending inner-transaction hash"
        },
        {
            "name": "release",
            "args": [
                {
                    "type": "appl",
                    "name": "parent_call"
                }
            ],
            "returns": {
                "type": "byte[]"
            },
            "desc": "Releases AlgoPoaP and allows all AlgoPoaP attendee's to start claiming"
        },
        {
            "name": "get_metric",
            "args": [
                {
                    "type": "string",
                    "name": "metric_signature"
                }
            ],
            "returns": {
                "type": "byte[]"
            },
            "desc": "Gets an specific metric by signature string"
        },
        {
            "name": "get_metrics",
            "args": [],
            "returns": {
                "type": "byte[]"
            },
            "desc": "Gets an specific metric by signature string"
        }
    ]
}

```
----

Since AlgoPoaP is totally decentralized, trustless and permission-less: Every AlgoPoaP item author has full authority of the created PoaPs (AlgoPoaP-DAO is coming with dao, voting and governance features in near future, after startup formation. Preferably I will use integration to an already working service with ABI)!

The algopoap_contract.json contains the ABI Schema for parent AlgoPoaP contract and algopoap_item_contract.json is the full ABI Schema of AlgoPoaP item contract which will be created by an C2C call via an inner transaction.