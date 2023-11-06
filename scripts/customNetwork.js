const { HardhatNetworkUserConfig } = require("hardhat/types");

async function main() {
  const customNetworkConfig = {
    live: false,
    saveDeployments: true,
    tags: ["local"],
    chainId: 1337, // Change to your desired chain ID
    forking: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`, // Change to your desired forking URL
      blockNumber: 13004111, // Block number to fork from
    },
    initialBaseFeePerGas: 0, // Set the initial base fee per gas
    accounts: {
      mnemonic: process.env.MNEMONIC,
    },
    startTime: 1641470400, // Set custom start time
    initialBlockNumber: 1000, // Set custom initial block number
  };

  await runHardhatNode(customNetworkConfig);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
