// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import './HomeTransaction.sol';

contract Factory {
    address[] public contractsList;

    event HomeTransactionCreated(address indexed homeTransaction, address indexed realtor, address indexed seller, address buyer);

    function create(
        string memory _address,
        string memory _zip,
        string memory _city,
        uint256 _realtorFee,
        uint256 _price,
        address payable _seller,
        address payable _buyer
    ) public returns (address homeTransaction) {
        HomeTransaction instance = new HomeTransaction(
            _address,
            _zip,
            _city,
            _realtorFee,
            _price,
            payable(msg.sender),
            _seller,
            _buyer
        );

        homeTransaction = address(instance);
        contractsList.push(homeTransaction);

        emit HomeTransactionCreated(homeTransaction, msg.sender, _seller, _buyer);
    }

    function getInstance(uint256 index) public view returns (address instance) {
        require(index < contractsList.length, 'index out of range');
        instance = contractsList[index];
    }

    function getInstances() public view returns (address[] memory instances) {
        instances = contractsList;
    }

    function getInstanceCount() public view returns (uint256 count) {
        count = contractsList.length;
    }
}
