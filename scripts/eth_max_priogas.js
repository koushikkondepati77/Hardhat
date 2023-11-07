const { ethers } = require("hardhat");

async function main() {
  const MaxPriorityFeeManager = await ethers.getContractFactory("PriorityFeeManager");
  const maxPriorityFeeManager = await MaxPriorityFeeManager.deploy(1); // Initial maxPriorityFeePerGas

  const deployedContract = await maxPriorityFeeManager.deploy();
  await deployedContract.deployTransaction.wait(); // Wait for the deployment transaction to be mined

  console.log("MaxPriorityFeeManager deployed to:", deployedContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
