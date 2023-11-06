const { ethers } = require("hardhat");

async function main() {
  const MaxPriorityFeeManager = await ethers.getContractFactory("PriorityFeeManager");
  const maxPriorityFeeManager = await MaxPriorityFeeManager.deploy(1); // Initial maxPriorityFeePerGas

  await maxPriorityFeeManager.deployed();

  console.log("MaxPriorityFeeManager deployed to:", maxPriorityFeeManager.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
