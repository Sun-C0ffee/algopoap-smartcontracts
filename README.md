![](https://avatars.githubusercontent.com/u/106061767?s=96&v=4)
# AlgoPoaP Smart Contracts 
**This repository contains SmartContracts for AlgoPoaP dApp on Algorand.**

[AlgoPoaP's Frontend Repository](https://github.com/AlgoPoaP/algopoap)

AlgoPoaP ASC System is designed on basis of newest TEAL features came with TEAL v 6.0 on AVM V1.1. AlgoPoaP Parent contract is created and thereafter every AlgoPoaP item is created by this parent contract based on configurations needed.


----
### Entities Relations:

```mermaid
  graph TD;
      AlgoPoaP_Service== creates ==>Parent_AlgoPoaP_ASC;
      Parent_AlgoPoaP_ASC== creates ==>AlgoPoaP_Controler_ASC;
      Parent_AlgoPoaP_ASC== creates ==>AlgoPoaP_item_ASC;
      
      AlgoPoaP_User== interacts ==>AlgoPoaP_item_ASC;
      AlgoPoaP_item_ASC== interacts ==>AlgoPoaP_Controler_ASC;
      AlgoPoaP_Author== interacts ==>Parent_AlgoPoaP_ASC;
      AlgoPoaP_Author== interacts ==>AlgoPoaP_item_ASC;
```

----
### Lifecycle:

```mermaid
  stateDiagram-v2
    [*] --> AlgoPoaP_Service
    AlgoPoaP_Service --> Parent_AlgoPoaP_ASC
    Parent_AlgoPoaP_ASC --> AlgoPoaP_Controler_ASC
    Parent_AlgoPoaP_ASC --> AlgoPoaP_item_ASC
    AlgoPoaP_item_ASC --> Archive
    Archive --> [*]
```
----
### PoaP ASC TEAL Graph:

```mermaid
  stateDiagram-v2
    [*] --> ASC_ENTRY
    ASC_ENTRY --> b_general_checks
    b_general_checks --> b_on_completion
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
    b_noop --> b_c2c_create
    b_c2c_create --> Log_and_Return
    b_noop --> b_c2c_delete
    b_c2c_create --> Log_and_Return
    b_noop --> b_c2cn_update
    b_c2c_create --> Log_and_Return
    b_noop --> b_c2c_closeout
    b_c2c_create --> Log_and_Return
    b_noop --> b_c2c_noop
    b_c2c_noop --> Log_and_Return
    Log_and_Return --> [*]
    
```
----

### PoaP Item ASC TEAL Graph:

```mermaid
  stateDiagram-v2
    [*] --> ITEM_ASC_ENTRY
    ITEM_ASC_ENTRY --> b_general_checks
    b_general_checks --> b_on_completion
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
    b_noop --> b_setup
    b_setup --> b_smart_nft_create
    b_setup --> b_c2c_optin
    b_noop --> b_activate
    b_noop --> b_release
    b_release --> b_nft_send
    b_release --> b_c2c_geo
    b_release --> b_c2c_time
    b_release --> b_c2c_sig
    b_release --> b_c2c_qr
    b_release --> b_claim
    b_release --> Log_and_Return
   
    
    Log_and_Return --> [*]
    
```
----
### UseCase:

```mermaid
  flowchart TB
    id1([Author]) --uses--> parentASC
    id1([Author]) --uses--> itemASC
    id2([User]) --uses--> itemASC 
    id2([User]) --uses--> parentASC 
    id2([User]) --uses--> controllerASC 

    subgraph -

      subgraph parentASC
      id6([optin])--uses-->id7([update states]) 
      
      id9([closeout])
      end
      subgraph itemASC
      id8([create]) 
      id9([optin]) 
      id10([update states])
      id13([Respond C2C])
      id9([closeout]) 
      end
      subgraph controllerASC
      id13([Respond C2C])
      end
    end 
   
    controllerASC --extends--> itemASC
    itemASC --extends--> parentASC

```

Since AlgoPoaP is totally decentralized, trustless and permissionless: Every AlgoPoaP item author has full authority of the created PoaPs (AlgoPoaP-DAO is coming with dao, voting and governance features in near future, after startup formation. Preferably I will use integration to an already working service with ABI)!

The algopoap_contract.json contains the ABI Schema for parent AlgoPoaP contract and algopoap_item_contract.json is the full ABI Schema of AlgoPoaP item contract which will be created by an C2C call via an inner transaction.

----
### PoaP Dynamic NFTs:

AlgoPoaP initially issues just one type of parametrized SVG certificate including the QRCode of issuance transaction on Algorand. BYON (Bring your own NFT) is planned for next phases and also there is an idea of  **PoaP NFT Design Studio** under assessment currently.

![](/algopoap-nft-sample.png)



