const hre = require("hardhat")

async function main() {
  // await hre.run('compile');

  const Vault = await hre.ethers.getContractFactory("Vesting");

  const vault = await Vault.deploy(process.env.ERC20_TOKEN);

  await vault.deployed();

  console.log("Vault deployed to:", vault.address);
  
  // now approve the tokens to the contract!
  // it doesnt matter that we use a mock

  const token = await hre.ethers.getContractFactory("ERC20Mock");
  const contract = await token.attach(process.env.ERC20_TOKEN);

  const name = await contract.approve(vault.address, process.env.ALLOWANCE);

  console.log("approved!", name);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

