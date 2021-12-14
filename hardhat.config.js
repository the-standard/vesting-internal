require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

excludeContracts: ['contracts/mocks/*', 'file.sol', 'file.sol:contractName']

const { RINKEBY_PRIVATE_KEY, INFURA_API_KEY } = process.env;

module.exports = {
  // networks: {
  //   rinkeby: {
  //     url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`,
  //     accounts: [`${RINKEBY_PRIVATE_KEY}`]
  //   }
  // },
  solidity: {
    compilers: [
      {
        version: "0.5.0",
      },
      {
        version: "0.8.4",
        settings: {},
      },
    ],
  },
};
