// GasPriceEstimation.sol
// This contract demonstrates the use of the eth_maxPriorityFeePerGas RPC method.
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract GasPriceEstimation {
    uint256 public maxPriorityFeePerGas;

    constructor() {
        maxPriorityFeePerGas = block.basefee; // Use EIP-1559 base fee as an example.
    }
}
