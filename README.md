# AlgoPoaP Smart Contracts 
![](https://avatars.githubusercontent.com/u/106061767?s=96&v=4)

**This repository contains SmartContracts for AlgoPoaP dApp on Algorand.**

- [AlgoPoaP's Frontend Repository](https://github.com/AlgoPoaP/algopoap)

- [AlgoPoaP Documentation](https://github.com/AlgoPoaP)

- [AlgoPoaP Website (algopoap.com)](https://algopoap.com)

- [AlgoPoaP dApp (algopoap.xyz)](https://algopoap.xyz)
 
- [Algorand NFDomain (algopoap.algo)](https://algopoap.algo.xyz)


AlgoPoaP ASC System is designed on basis of newest TEAL features came with TEAL v 6.0 on AVM V1.1. AlgoPoaP Parent contract is created and thereafter every AlgoPoaP item is created by this parent contract based on configurations needed.


```mermaid
  graph TD;
      AlgoPoaP_Service== manages ==>Parent_AlgoPoaP_ASC;
      Parent_AlgoPoaP_ASC== manages ==>AlgoPoaP_item_ASC;
      
      AlgoPoaP_Attendee== interacts ==>AlgoPoaP_item_ASC;
      AlgoPoaP_Author== interacts ==>Parent_AlgoPoaP_ASC;
      AlgoPoaP_Author== interacts ==>AlgoPoaP_item_ASC;
```

----



