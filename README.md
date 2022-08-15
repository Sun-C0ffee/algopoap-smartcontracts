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
      Parent_AlgoPoaP_ASC== creates ==>AlgoPoaP_item_ASC;
      
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
    id1([Author]) --uses--> parentASC
    id1([Author]) --uses--> itemASC
    id2([Attendee]) --uses--> itemASC 
    id2([Attendee]) --uses--> parentASC 

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
    end 
   

    itemASC --extends--> parentASC

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
    b_noop --> b_setup
    b_noop --> Log_and_Return

    method --> c2c_create
    c2c_create --> Log_and_Return
    method --> c2c_delete
    c2c_delete --> Log_and_Return
    method --> c2c_update
    c2c_update --> Log_and_Return
    method --> c2c_closeout
    c2c_closeout --> Log_and_Return
   
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
    AlgoPoaP_ASC : +String poap_last_appid
    AlgoPoaP_ASC : +String poap_last_author
    AlgoPoaP_ASC : +String poap_last_attendee
   
    class PoaP {
        +create()
        +update()
        +delete()
        +closeout()
        +metrics()
    }
    
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
    b_setup --> b_nft_create
    b_setup --> Log_and_Return
   


    method --> activate
    activate --> b_activate
    b_activate --> Log_and_Return


    method --> claim
    claim --> b_claim

    b_claim --> b_geo
    b_claim --> b_time
    b_claim --> b_sig
    b_claim --> b_qr
    b_claim --> b_nft_send
    b_claim --> Log_and_Return


    method --> release
    release --> b_release_sig
    b_release_sig --> b_nft_send
    b_release --> Log_and_Return
  
    
    Log_and_Return --> [*]
    
```
----
### AlgoPoaP ASC ITEM ABI :

```mermaid
  classDiagram
    AlgoPoaP_ASC_ITEM <|-- PoaP_ITEM
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
    AlgoPoaP_ASC_ITEM : +String poap_item_last_attendee
    AlgoPoaP_ASC_ITEM : +String poap_item_last_apply
    AlgoPoaP_ASC_ITEM : +String poap_item_last_issuance
    AlgoPoaP_ASC_ITEM : +String poap_item_last_nft_issuance
    AlgoPoaP_ASC_ITEM : +String poap_item_last_txn_issuance
   
    class PoaP_ITEM {
        +setup()
        +activate()
        +claim()
        +release()
        +metrics()
    }
    
```
