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
    [*] --> AlgoPoaP_Service
    AlgoPoaP_Service --> Parent_AlgoPoaP_ASC
    Parent_AlgoPoaP_ASC --> AlgoPoaP_Controler_ASC
    Parent_AlgoPoaP_ASC --> AlgoPoaP_item_ASC
    AlgoPoaP_item_ASC --> Archive
    Archive --> [*]
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

AlgoPoaP initially starts by using and issuing one type of parametrized SVG certificate including the QRCode of issuance transaction on Algorand. It's planned for **PoaP NFT Design Studio**

![](/algopoap-nft-sample.png)



