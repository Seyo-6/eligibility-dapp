// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Simple mintable ERC-20 for local testing only. Do NOT deploy
///         this to a real network — use a real stablecoin there instead.
contract MockStablecoin is ERC20 {
    constructor(uint256 initialSupply) ERC20("Mock USD", "mUSD") {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
