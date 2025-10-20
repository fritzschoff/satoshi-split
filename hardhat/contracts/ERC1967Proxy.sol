// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title ERC1967Proxy
 * @dev This contract is a wrapper around OpenZeppelin's ERC1967Proxy
 * to make it available for deployment via Hardhat
 */
contract ERC1967ProxyWrapper is ERC1967Proxy {
    constructor(
        address implementation,
        bytes memory _data
    ) ERC1967Proxy(implementation, _data) {}
}

