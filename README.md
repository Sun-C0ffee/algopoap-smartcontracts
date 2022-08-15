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
### AlgoPoaP ASC TEAL Graph:

```mermaid
  stateDiagram-v2
    [*] --> b_main
    b_main --> b_general_checks
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
    b_noop --> Log_and_Return

    method --> c2c_create
    c2c_create --> Log_and_Return
    method --> c2c_delete
    c2c_delete --> Log_and_Return
    method --> c2cn_update
    c2cn_update --> Log_and_Return

   
    Log_and_Return --> [*]
    
```
----

### AlgoPoaP Item ASC TEAL Graph:

```mermaid
  stateDiagram-v2
    [*] --> b_main
    b_main --> b_general_checks
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
    method --> setup
    setup --> b_setup
    b_setup --> b_nft_create
    b_setup --> Log_and_Return

    b_noop --> b_activate
    method --> activate
    activate --> b_activate
    b_activate --> Log_and_Return

    b_noop --> b_claim
    method --> claim
    claim --> b_claim

    b_claim --> b_geo
    b_claim --> b_time
    b_claim --> b_sig
    b_claim --> b_qr
    b_claim --> b_nft_send
    b_claim --> Log_and_Return

    b_noop --> b_release_sig
    method --> release
    release --> b_release_sig
    b_release_sig --> b_nft_send
    b_release --> Log_and_Return
   
    b_noop --> b_metrics_update
    method --> metrics
    metrics --> b_metrics_update
    b_metrics_update --> Log_and_Return
    
    Log_and_Return --> [*]
    
```
----

### AlgoPoaP ASC ABI :

```mermaid
  classDiagram
    AlgoPoaP_ASC <|-- PoaP
    AlgoPoaP_ASC : +Uint64 poap_txn_count
    AlgoPoaP_ASC : +Uint64 poap_issuance_count
    AlgoPoaP_ASC : +Uint64 poap_geo_issuance_count
    AlgoPoaP_ASC : +Uint64 poap_qr_issuance_count
    AlgoPoaP_ASC : +Uint64 poap_sig_issuance_count
    AlgoPoaP_ASC : +Uint64 poap_item_count
    AlgoPoaP_ASC : +Uint64 poap_author_count
     AlgoPoaP_ASC : +Uint64 poap_attendee_count
    AlgoPoaP_ASC : +String poap_last_appid
    AlgoPoaP_ASC : +String poap_last_author
    AlgoPoaP_ASC : +String poap_last_attendee
   
    class PoaP {
        +Uint64 poap_created_count
        +String poap_last_item
        +setup()
        +activate()
        +claim()
        +release()
        +metrics()
    }
    
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




