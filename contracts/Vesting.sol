//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
// import "hardhat/console.sol";

contract Vesting is Ownable {

  using SafeMath for uint256;
  using SafeMath for uint16;

  uint256 public count;             // the number of users we have in here
  uint256 public totalAllocated;    // the total number of tokens allocated
  uint256 public totalClaimed;      // the total amount claimed
  uint8 public active;              // is the vault active?
  uint public months;

  ERC20 public token;               // the address for the token

  struct User {
    uint256 id;
    string name;
    uint256 total;
    uint256 balance;
    uint256 initial;
    address[] addresses;
  }

  mapping (uint256 => User) public users;

  event UserAdded(uint256 userId);
  event UserRemoved(uint256 userId);
  event BalanceTransfer(uint256 userId, uint256 amount, uint address_id);
  event VaultClosed(uint id);

  constructor(ERC20 _token, uint _months) public {
    require(address(_token) != address(0));
    active = 1;
    token = _token;
    months = _months; // TODO test months set
  }

  function add(
    string memory name,
    uint256 amount,
    uint256 initial,
    address[] memory addresses
  ) public onlyOwner returns (uint256) {
    require(active == 1, "not-active");

    // create the user
    User memory user = User({
      id: count,
      name: name,
      total: amount,
      balance: amount.sub(initial),
      initial: initial,
      addresses: addresses
    });

    // add the user to the array;
    users[count] = user;

    // emit an event
    emit UserAdded(count);

    // increment the counter
    count++;

    ERC20 token = ERC20(token);

    require(token.transferFrom(owner(), address(this), amount), "transfer failed");

    // return the count for the fun of it
    return count;
  }

  function remove(uint256 id) public onlyOwner {
    ERC20 token = ERC20(token);
    User storage user = users[id];

    require(token.transfer(owner(), user.balance));

    user.balance = 0;
    emit UserRemoved(id);
  }

  // returns the amount a user is allocated
  function userAddresses(uint256 id) public view returns (address[] memory) {
    User storage user = users[id];
    return user.addresses;
  }

  // returns the amount a user is allocated
  function userTotal(uint256 id) public view returns (uint256) {
    User storage user = users[id];
    return user.total;
  }

  // returns the user's balance
  function userBalance(uint256 id) public view returns (uint256) {
    User storage user = users[id];
    return user.balance;
  }

  // returns the user's name
  function userName(uint256 id) public view returns (string memory) {
    User storage user = users[id];
    return user.name;
  }

  function process(ERC20 token, address _address, uint256 amount, uint _address_id, User memory user) private {
    require(token.transfer(_address, amount), "transfer-failed");
    user.balance = user.balance.sub(amount);
    users[user.id] = user;
    emit BalanceTransfer(user.id, amount, _address_id);
  }

  // function transfer(uint256[] memory _ids, uint256 amount, uint _address_id) external onlyOwner {
  //   require(active == 1, "not-active");
  //   require(count > 0, "error-no-users");
  //   require(_address_id <= 4, "error-no-address");

  //   ERC20 token = ERC20(token);

  //   for(uint8 i=0; i<_ids.length; i++){
  //     User memory user = users[_ids[i]];

  //     // continue if the user balance is less than the amount;
  //     if (user.balance < amount) {
  //       continue;
  //     }

  //     address _address = users[i].addresses[_address_id];
  //     process(token, _address, amount, _address_id, user);
  //   }
  // }

  function transfer(uint256[] memory _ids, uint _address_id) external onlyOwner {
    require(active == 1, "not-active");
    require(count > 0, "error-no-users");
    require(_address_id <= 4, "error-no-address");

    ERC20 token = ERC20(token);

    for(uint8 i=0; i<_ids.length; i++){
      User memory user = users[_ids[i]];

      // if the user balance is zero, don't transfer anything
      if (user.balance <= 0) {
        continue;
      }

      uint256 b = user.total.sub(user.initial);
      uint256 amount = b.div(uint256(months));

      // if the balance of the user is less than the monthly amount
      // just use the balance of the user, which should zero stuff out
      if (user.balance < amount) {
        amount = user.balance;
      }

      // continue if the user balance is less than the amount;
      // if (user.balance < amount) {
      //   continue;
      // }

      address _address = users[i].addresses[_address_id];
      process(token, _address, amount, _address_id, user);
    }
  }

  function close() external onlyOwner {
    ERC20 token = ERC20(token);
    uint256 balance = token.balanceOf(address(this));

    require(token.transfer(owner(), balance));

    active = 0;
    emit VaultClosed(0);
  }
}
