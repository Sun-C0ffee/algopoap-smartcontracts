![](https://avatars.githubusercontent.com/u/106061767?s=96&v=4)
# AlgoPoaP Smart Contracts 

**Algorand SmartContracts for AlgoPoaP dApp and AlgoPoaP Service.**

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
    [*] --> Parent_AlgoPoaP_ASC
    Parent_AlgoPoaP_ASC --> [*]
    Parent_AlgoPoaP_ASC --> AlgoPoaP_Controler_ASC
    Parent_AlgoPoaP_ASC --> AlgoPoaP_item_ASC
    
    AlgoPoaP_item_ASC --> Archive
    Archive --> [*]
```
----
### UseCase:

```mermaid
  flowchart TB
     id1([User]) --uses--> onboard 
     id2([Author]) --uses--> onboard
     id3([System]) --uses--> initiate
    subgraph initiate
    id4([deploy parent]) 
    id5([deploy controllers])
    end 
    subgraph onboard
    id6([optin]) 
    id7([write states])
    end
    subgraph author
    id8([create]) 
    id9([optin]) 
    id10([write states])
    end
    subgraph attend
      id11([optin]) 
    id12([write states])
    id13([release])
    end
    id2 --> author
    id1 --> attend
```
----


Since AlgoPoaP is totally decentralized, trustless and permissionless: Every AlgoPoaP item author has full authority of the created PoaPs (AlgoPoaP-DAO is coming with dao, voting and governance features in near future, after startup formation)!

The algopoap_contract.json contains the ABI Schema for parent AlgoPoaP contract and algopoap_item_contract.json is the full ABI Schema of AlgoPoaP item contract which will be created by an C2C call via an inner transaction.


