const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vesting", function () {

  let token;  // the token
  let tokens; // the number of tokens

  beforeEach(async function () {
    const [owner] = await ethers.getSigners();

    // deploy the token
    tokens = 1_000_000_000;
    const ERC20Mock = await ethers.getContractFactory('ERC20Mock');

    token = await ERC20Mock.deploy('EGGTOKEN', 'EGG', owner.address, tokens);
    await token.deployed();
  });

  it("Should add a person to the vault", async function () {
    const [owner, ana, simon] = await ethers.getSigners();

    // what we're allocated
    const a = 50_000_000;

    const Vault = await ethers.getContractFactory("Vesting");

    const vault = await Vault.deploy(token.address);
    await vault.deployed();

    expect(await vault.token()).to.eq(ethers.utils.getAddress(token.address));

    // approve the contract to spend the money
    await token.approve(vault.address, a, { from: owner.address });

    // check the token balance
    const vaultB = await token.balanceOf(owner.address);
    expect(vaultB).to.eq(tokens);

    expect(await vault.add("Ana", a, [ana.address])).to.emit(vault, 'UserAdded').withArgs(0);

    const u = await vault.userTotal(0);
    expect(ethers.BigNumber.from(a)).to.equal(ethers.BigNumber.from(u));

    const name = await vault.userName(0);
    expect(name).to.equal("Ana");

    const aa = await vault.userAddresses(0);
    expect(aa.length).to.eq(1);
    expect(aa[0]).to.eq(ethers.utils.getAddress(ana.address));
  });

  it("Should transfer funds to the user", async function () {
    const [owner, ana] = await ethers.getSigners();
    const Vault = await ethers.getContractFactory("Vesting");

    const vault = await Vault.deploy(token.address);
    await vault.deployed();

    let userBalance = await token.balanceOf(ana.address);
    expect(userBalance).to.eq(0);

    const a = 50_000_000;

    // should revert
    await expect(vault.transfer([0], a, 0)).to.be.revertedWith("error-no-users");

    // approve the contract to spend the money
    await token.approve(vault.address, a, { from: owner.address });

    const vaultB = await token.balanceOf(owner.address);
    expect(vaultB).to.eq(tokens);

    // add ana
    expect(await vault.add("Ana", a, [ana.address])).to.emit(vault, 'UserAdded').withArgs(0);

    // now transfer again
    const half = a / 2;
    await vault.transfer([0], half, 0);
    userBalance = await token.balanceOf(ana.address);
    expect(userBalance).to.eq(half);

    // balance should eq 0
    let u = await vault.userBalance(0);
    expect(ethers.BigNumber.from(half)).to.equal(ethers.BigNumber.from(u));

    // now transfer again
    await vault.transfer([0], half, 0);
    u = await vault.userBalance(0);
    expect(ethers.BigNumber.from(0)).to.equal(ethers.BigNumber.from(u));
    
    userBalance = await token.balanceOf(ana.address);
    expect(userBalance).to.eq(half*2);

    // now transfer again
    await vault.transfer([0], half, 0);
    u = await vault.userBalance(0);
    expect(ethers.BigNumber.from(0)).to.equal(ethers.BigNumber.from(u));
    
    userBalance = await token.balanceOf(ana.address);
    expect(userBalance).to.eq(half*2);
  });

  it("Should transfer funds to two users", async function () {
    const [owner, ana, simon] = await ethers.getSigners();
    const Vault = await ethers.getContractFactory("Vesting");

    const vault = await Vault.deploy(token.address);
    await vault.deployed();

    let userBalance = await token.balanceOf(ana.address);
    expect(userBalance).to.eq(0);

    const a = 500_000_000;

    // should revert
    await expect(vault.transfer([0], a, 0)).to.be.revertedWith("error-no-users");

    // approve the contract to spend the money
    await token.approve(vault.address, a, { from: owner.address });

    const vaultB = await token.balanceOf(owner.address);
    expect(vaultB).to.eq(tokens);

    const aa = 50_000_000;

    // add ana
    expect(await vault.add("Ana", aa, [ana.address])).to.emit(vault, 'UserAdded').withArgs(0);

    // add simon
    expect(await vault.add("Simon", aa, [simon.address])).to.emit(vault, 'UserAdded').withArgs(1);

    // now transfer 
    await vault.transfer([0,1,2], aa, 0);

    // balances
    const anaB = await token.balanceOf(ana.address);
    expect(anaB).to.eq(aa);
    const simonB = await token.balanceOf(simon.address);
    expect(simonB).to.eq(aa);

    // balance should eq 0
    let u = await vault.userBalance(0);
    expect(ethers.BigNumber.from(0)).to.equal(ethers.BigNumber.from(u));

    u = await vault.userBalance(1);
    expect(ethers.BigNumber.from(0)).to.equal(ethers.BigNumber.from(u));
  });

  it("Should not open a vault from the owner address", async function () {
    // const [owner, test] = await ethers.getSigners();

    // const Vault = await ethers.getContractFactory("Vesting");
    // const vault = await Vault.deploy();
    // await vault.deployed();

    // expect(await vault.owner()).to.eq(owner.address);

    // await expect(vault.add("Ana", 500000, { from: test.address })).to.be.revertedWith("vault-owner-address-0");
  });
});

// change addresses
// remove user
