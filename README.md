# AlgoPoaP Smart Contracts 
![](https://avatars.githubusercontent.com/u/106061767?s=96&v=4)

**WIP! WIP! This repository contains SmartContracts for AlgoPoaP dApp on Algorand. Currently under development!!!**

- [AlgoPoaP Documentation](https://github.com/AlgoPoaP)

- [AlgoPoaP Website (algopoap.com)](https://algopoap.com)

- [AlgoPoaP dApp (algopoap.xyz)](https://algopoap.xyz)
 
- [Algorand NFDomain (algopoap.algo)](https://app.nf.domains/name/algopoap.algo)
----


AlgoPoaP is the Proof of Attendance Protocol built on Algorand (AVM7) which aims to be elevated into a Proof Of Anything Protocol in future with use of state proofs feature on Algorand

AlgoPoaP ASC System is designed on basis of TEAL features came with TEAL v 7.0 on AVM6. AlgoPoaP Parent contract is created and thereafter every AlgoPoaP item is created by this parent contract based on configurations needed.


```mermaid
  graph TD;
      AlgoPoaP_Service== manages ==>Parent_AlgoPoaP_ASC;
      Parent_AlgoPoaP_ASC== manages ==>AlgoPoaP_item_ASC;
      
      AlgoPoaP_Attendee== interacts ==>AlgoPoaP_item_ASC;
      AlgoPoaP_Author== interacts ==>Parent_AlgoPoaP_ASC;
      AlgoPoaP_Author== interacts ==>AlgoPoaP_item_ASC;
```

----



