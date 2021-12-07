//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";

contract Vesting is Ownable {

  using SafeMath for uint256;
  using SafeMath for uint16;

  uint256 public count;             // the number of users we have in here
  uint256 public totalAllocated;    // the total number of tokens allocated
  uint256 public totalClaimed;      // the total amount claimed

  // uint public decimals;          // the decimals for the token;
  ERC20 public token;               // the address for the token

  struct User {
    uint256 id;
    string name;
    uint256 total;
    uint256 balance;
    address[] addresses;
  }

  mapping (uint256 => User) public users;

  event UserAdded(uint256 userId);

  constructor(ERC20 _token) public {
    require(address(_token) != address(0));
    token = _token;
  }

  function add(string memory name, uint256 amount, address[] memory addresses) public onlyOwner returns (uint256) {
    // create the user
    User memory user = User({
      id: count,
      name: name,
      total: amount,
      balance: amount,
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

  function process(ERC20 token, address _address, uint256 amount, User memory user) private {
    require(token.transfer(_address, amount), "transfer-failed");
    user.balance = user.balance - amount;
    users[user.id] = user;
  }

  function transfer(uint256 amount) external {
    require(count > 0, "error-no-users");

    ERC20 token = ERC20(token);

    for(uint8 i=0; i<count; i++){
      User memory user = users[i];

      // continue if the user balance is less than the amount;
      if (user.balance < amount) {
        continue;
      }

      for(uint8 a=0; a<users[i].addresses.length; a++) {
        address _address = users[i].addresses[a];
        // random address
        process(token, _address, amount, user);
      }
    }
  }
}
