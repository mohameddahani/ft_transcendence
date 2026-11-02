// SPDX-License-Identifier: MIT

pragma solidity  ^0.8.34;

import  "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";

contract    GymTokenForwarder is ERC2771Forwarder("GymTokenForwarder") {}