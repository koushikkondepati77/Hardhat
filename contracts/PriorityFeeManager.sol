// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract PriorityFeeManager {
    uint256 public maxPriorityFeePerGas;

    constructor(uint256 _initialMaxPriorityFeePerGas) {
        maxPriorityFeePerGas = _initialMaxPriorityFeePerGas;
    }

    function setMaxPriorityFeePerGas(uint256 _newMaxPriorityFeePerGas) external {
        maxPriorityFeePerGas = _newMaxPriorityFeePerGas;
    }
}
