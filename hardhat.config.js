/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    custom: {
      chainId: 1337, // Change to your desired chain ID
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`, // Change to your desired forking URL
        blockNumber: 13004111, // Block number to fork from
      },
      initialBaseFeePerGas: 0, // Set the initial base fee per gas
      startTime: 1641470400, // Set custom start time
      initialBlockNumber: 1000, // Set custom initial block number
    },
  },
};
