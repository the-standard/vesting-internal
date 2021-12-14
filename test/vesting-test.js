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
    const i = 2_000_000;

    const Vault = await ethers.getContractFactory("Vesting");

    const vault = await Vault.deploy(token.address, 24);
    await vault.deployed();

    expect(await vault.token()).to.eq(ethers.utils.getAddress(token.address));
    expect(await vault.active()).to.eq(1);
    expect(await vault.months()).to.eq(24);

    // approve the contract to spend the money
    await token.approve(vault.address, a, { from: owner.address });

    // check the token balance
    const vaultB = await token.balanceOf(owner.address);
    expect(vaultB).to.eq(tokens);

    expect(await vault.add("Ana", a, i, [ana.address])).to.emit(vault, 'UserAdded').withArgs(0);

    const u = await vault.userTotal(0);
    expect(ethers.BigNumber.from(a)).to.equal(ethers.BigNumber.from(u));

    const ub = await vault.userBalance(0);
    expect(ethers.BigNumber.from(a-i)).to.equal(ethers.BigNumber.from(ub));

    const name = await vault.userName(0);
    expect(name).to.equal("Ana");

    const aa = await vault.userAddresses(0);
    expect(aa.length).to.eq(1);
    expect(aa[0]).to.eq(ethers.utils.getAddress(ana.address));
  });

  it("Should transfer init amount to the user", async function () {
  })

  it("Should transfer funds to the user", async function () {
    const [owner, ana] = await ethers.getSigners();
    const Vault = await ethers.getContractFactory("Vesting");

    const vault = await Vault.deploy(token.address, 24);
    await vault.deployed();

    let userBalance = await token.balanceOf(ana.address);
    expect(userBalance).to.eq(0);

    const a = 50_000_000;
    const i = 2_000_000;

    // should revert
    await expect(vault.transfer([0], 0)).to.be.revertedWith("error-no-users");

    // approve the contract to spend the money
    await token.approve(vault.address, a, { from: owner.address });

    const vaultB = await token.balanceOf(owner.address);
    expect(vaultB).to.eq(tokens);

    // add ana
    expect(await vault.add("Ana", a, i, [ana.address])).to.emit(vault, 'UserAdded').withArgs(0);

    const startingBalance = a - i;
    const monthly = startingBalance / 24;
    for (let month = 1; month <= 24; month++) {
      const balance = monthly * month;
      await vault.transfer([0], 0);
      userBalance = await token.balanceOf(ana.address);
      expect(userBalance).to.eq(balance);

      const left = startingBalance - balance;
      let u = await vault.userBalance(0);
      expect(ethers.BigNumber.from(left)).to.equal(ethers.BigNumber.from(u));

      expect(await token.balanceOf(vault.address)).to.eq(a-balance);
    }
    
    const balance = startingBalance;
    await vault.transfer([0], 0);
    userBalance = await token.balanceOf(ana.address);
    expect(userBalance).to.eq(balance);
  });

  // it("Should transfer funds to two users", async function () {
  //   const [owner, ana, simon] = await ethers.getSigners();
  //   const Vault = await ethers.getContractFactory("Vesting");

  //   const vault = await Vault.deploy(token.address);
  //   await vault.deployed();

  //   let userBalance = await token.balanceOf(ana.address);
  //   expect(userBalance).to.eq(0);

  //   const a = 500_000_000;
  //   // const xx = 30_000_000

  //   // should revert
  //   await expect(vault.transfer([0], a, 0)).to.be.revertedWith("error-no-users");

  //   // approve the contract to spend the money
  //   await token.approve(vault.address, a, { from: owner.address });

  //   const vaultB = await token.balanceOf(owner.address);
  //   expect(vaultB).to.eq(tokens);

  //   const aa = 50_000_000;

  //   // add ana
  //   expect(await vault.add("Ana", aa, [ana.address])).to.emit(vault, 'UserAdded').withArgs(0);

  //   // add simon
  //   expect(await vault.add("Simon", aa, [simon.address])).to.emit(vault, 'UserAdded').withArgs(1);

  //   // now transfer
  //   await vault.transfer([0,1,2], aa, 0);

  //   // balances
  //   const anaB = await token.balanceOf(ana.address);
  //   expect(anaB).to.eq(aa);
  //   const simonB = await token.balanceOf(simon.address);
  //   expect(simonB).to.eq(aa);

  //   // balance should eq 0
  //   let u = await vault.userBalance(0);
  //   expect(ethers.BigNumber.from(0)).to.equal(ethers.BigNumber.from(u));

  //   u = await vault.userBalance(1);
  //   expect(ethers.BigNumber.from(0)).to.equal(ethers.BigNumber.from(u));
  // });

  // it("Should delete a user and funds", async function () {
  //   const [owner, ana, simon] = await ethers.getSigners();
  //   const Vault = await ethers.getContractFactory("Vesting");

  //   const vault = await Vault.deploy(token.address);
  //   await vault.deployed();

  //   const a = 500_000_000;

  //   // approve the contract to spend the money
  //   await token.approve(vault.address, a, { from: owner.address });

  //   const vaultB = await token.balanceOf(owner.address);
  //   expect(vaultB).to.eq(tokens);

  //   const aa = 50_000_000;

  //   // add ana
  //   expect(await vault.add("Ana", aa, [ana.address])).to.emit(vault, 'UserAdded').withArgs(0);

  //   let u = await vault.userBalance(0);
  //   expect(ethers.BigNumber.from(aa)).to.equal(ethers.BigNumber.from(u));

  //   expect(await token.balanceOf(owner.address)).to.eq(tokens-aa);
  //   expect(await token.balanceOf(vault.address)).to.eq(aa);

  //   // remove the user
  //   expect(await vault.remove(0)).to.emit(vault, 'UserRemoved').withArgs(0);

  //   u = await vault.userBalance(0);
  //   expect(ethers.BigNumber.from(0)).to.equal(ethers.BigNumber.from(u));

  //   expect(await token.balanceOf(owner.address)).to.eq(tokens);
  //   expect(await token.balanceOf(vault.address)).to.eq(0);
  // });

  // it("Should delete a user and funds after some vesting stuff", async function () {
  //   const [owner, ana, simon] = await ethers.getSigners();
  //   const Vault = await ethers.getContractFactory("Vesting");

  //   const vault = await Vault.deploy(token.address);
  //   await vault.deployed();

  //   const a = 500_000_000;

  //   // approve the contract to spend the money
  //   await token.approve(vault.address, a, { from: owner.address });

  //   const aa = 50_000_000;

  //   // check the balances are ok
  //   expect(await token.balanceOf(ana.address)).to.eq(0);
  //   expect(await token.balanceOf(owner.address)).to.eq(tokens);
  //   expect(await token.balanceOf(vault.address)).to.eq(0);

  //   // add ana
  //   expect(await vault.add("Ana", aa, [ana.address])).to.emit(vault, 'UserAdded').withArgs(0);

  //   let u = await vault.userBalance(0);
  //   expect(ethers.BigNumber.from(aa)).to.equal(ethers.BigNumber.from(u));

  //   // check things are in order
  //   expect(await token.balanceOf(ana.address)).to.eq(0);             // nothing transferred
  //   expect(await token.balanceOf(owner.address)).to.eq(tokens-aa);   // aa tokens allocated to the contract
  //   expect(await token.balanceOf(vault.address)).to.eq(aa);          // contract got some tokens!

  //   const value = aa / 5;
  //   await vault.transfer([0], value, 0);

  //   let balance = await vault.userBalance(0);
  //   expect(balance).to.eq(aa - value);
  //   expect(balance).to.eq(40_000_000);

  //   // check things are in order
  //   expect(await token.balanceOf(ana.address)).to.eq(value);         // only one transfer
  //   expect(await token.balanceOf(owner.address)).to.eq(tokens-aa);   // aa tokens allocated to the contract
  //   expect(await token.balanceOf(vault.address)).to.eq(aa - value);  // contract got some tokens - minus the ones it spent - 40,000,000


  //   // remove the user
  //   expect(await vault.remove(0)).to.emit(vault, 'UserRemoved').withArgs(0);

  //   u = await vault.userBalance(0);
  //   expect(ethers.BigNumber.from(0)).to.equal(ethers.BigNumber.from(u));

  //   expect(await token.balanceOf(ana.address)).to.eq(value);                  // see above
  //   expect(await token.balanceOf(owner.address)).to.eq(tokens-(value));       // because we have allocated 40,000,000 already
  //   expect(await token.balanceOf(vault.address)).to.eq(0);
  // });

  // it("Should close and return funds to owner", async function () {
  //   const [owner, ana, simon] = await ethers.getSigners();
  //   const Vault = await ethers.getContractFactory("Vesting");

  //   const vault = await Vault.deploy(token.address);
  //   await vault.deployed();

  //   const a = 500_000_000;

  //   // approve the contract to spend the money
  //   await token.approve(vault.address, a, { from: owner.address });

  //   const aa = 50_000_000;

  //   // check the balances are ok
  //   expect(await token.balanceOf(owner.address)).to.eq(tokens);
  //   expect(await token.balanceOf(vault.address)).to.eq(0);

  //   // add ana
  //   expect(await vault.add("Ana", aa, [ana.address])).to.emit(vault, 'UserAdded').withArgs(0);
  //   expect(await vault.add("Ana", aa, [simon.address])).to.emit(vault, 'UserAdded').withArgs(1);

  //   // check things are in order
  //   expect(await token.balanceOf(ana.address)).to.eq(0);                // nothing transferred
  //   expect(await token.balanceOf(simon.address)).to.eq(0);              // nothing transferred
  //   expect(await token.balanceOf(owner.address)).to.eq(tokens-(aa*2));  // aa tokens allocated to the contract
  //   expect(await token.balanceOf(vault.address)).to.eq(aa*2);           // contract got some tokens!

  //   // close the vault
  //   expect(await vault.close()).to.emit(vault, 'VaultClosed').withArgs(0);
  //   expect(await vault.active()).to.eq(0);
    
  //   // check things are in order
  //   expect(await token.balanceOf(owner.address)).to.eq(tokens);         // aa tokens allocated to the contract
  //   expect(await token.balanceOf(vault.address)).to.eq(0);              // contract got some tokens!

  //   // should fail
  //   await expect(vault.transfer([0], a, 0)).to.be.revertedWith("not-active");
  //   await expect(vault.add("Ana", aa, [ana.address])).to.be.revertedWith("not-active");
  // });
});

// change addresses
// divide by months or set months
