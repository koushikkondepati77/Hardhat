// gasPriceEstimationScript.js
// This script uses Hardhat and ethers.js to estimate the maxPriorityFeePerGas.

async function main() {
    const [signer] = await ethers.getSigners();
    const feeData = await ethers.provider.getFeeData(); // Use eth_maxPriorityFeePerGas
  
    console.log("Max Priority Fee Per Gas:", feeData.maxPriorityFeePerGas.toString());
  
    if (feeData.effectiveBaseFee !== undefined) {
      console.log("Effective Base Fee:", feeData.effectiveBaseFee.toString());
    } else {
      console.log("Effective Base Fee is not available.");
    }
  }
  
  main();
  