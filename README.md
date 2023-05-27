# Eigen Secret

Eigen Secret is a zk-zkRollup providing confidential transaction and selective exposure for users with low gas cost.

Building on Private State Model and zkSnark.

The circuits is written by Circom 2, proved by [eigen zkit](https://github.com/0xEigenLabs/eigen-zkvm/tree/main/zkit).

## Task

```
npx hardhat --help
```

## Gas Reporter

```
npx hardhat test
```
ETH Price: 1899.33 usd/eth

GasPrice: 20Gwei

Contract Method gas consumption

|Contract|Method| Min| Max|Avg| usd(avg)|
|:-:|:-:|:-:|:-:|:-:|:-:|
|Rollup|approveToken|-|-|63083|2.40|
|Rollup|deposit|-|-|226016|8.59|
|Rollup|processDeposits|-|-|2086729|79.27|
|Rollup|registerToken|-|-|49443|1.88|
|Rollup|update|333467|350963|339443|12.89|
|Rollup|withdraw|-|-|983815|37.37|
|TestToken|approve|46223|46235|46229|1.76|
|TestToken|transfer|26678|51378|50142|1.90|
|TokenRegistry|setRollupNC|-|-|46053|1.75|

Contract deployment gas consumption

|Deployments| Min| Max|Avg| usd(avg)|
|:-:|:-:|:-:|:-:|:-:|
|PoseidonFacade|-|-|354579|13.47|
|Rollup|-|-|4390248|166.77|
|SMT|358301|358313|358307|13.61|
|SpongePoseidon|-|-|271682|10.32|
|TestToken|-|-|735448|27.94|
|TokenRegistry|-|-|310495|11.79|

## SDK

The [SDK tutorial](https://0xeigenlabs.github.io/eigen-secret) is generated by typedoc.

## Licence

Not determined, any suggestions are welcome.
