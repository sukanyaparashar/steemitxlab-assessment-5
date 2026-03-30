// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HomeTransaction {
    uint256 public constant TIME_BETWEEN_DEPOSIT_AND_FINALIZATION = 5 minutes;
    uint256 public constant DEPOSIT_PERCENTAGE = 10;

    enum ContractState {
        WaitingSellerSignature,
        WaitingBuyerSignature,
        WaitingRealtorReview,
        WaitingFinalization,
        Finalized,
        Rejected
    }

    enum ClosingConditionsReview {
        Pending,
        Accepted,
        Rejected
    }

    ContractState public contractState = ContractState.WaitingSellerSignature;
    ClosingConditionsReview public closingConditionsReview = ClosingConditionsReview.Pending;

    address payable public realtor;
    address payable public seller;
    address payable public buyer;

    string public homeAddress;
    string public zip;
    string public city;
    uint256 public realtorFee;
    uint256 public price;
    uint256 public deposit;
    uint256 public finalizeDeadline;

    event SellerSigned(address indexed seller);
    event BuyerSigned(address indexed buyer, uint256 deposit, uint256 finalizeDeadline);
    event ClosingReviewed(bool accepted);
    event Finalized(address indexed buyer, uint256 price, uint256 realtorFee);
    event TransactionRejected(address indexed triggeredBy);

    modifier onlySeller() {
        require(seller == msg.sender, 'Only seller can sign contract');
        _;
    }

    modifier onlyBuyer() {
        require(buyer == msg.sender, 'Only buyer can perform this action');
        _;
    }

    modifier onlyRealtor() {
        require(realtor == msg.sender, 'Only realtor can review closing conditions');
        _;
    }

    modifier inState(ContractState expectedState) {
        require(contractState == expectedState, 'Wrong contract state');
        _;
    }

    constructor(
        string memory _address,
        string memory _zip,
        string memory _city,
        uint256 _realtorFee,
        uint256 _price,
        address payable _realtor,
        address payable _seller,
        address payable _buyer
    ) {
        require(_seller != address(0) && _buyer != address(0) && _realtor != address(0), 'Invalid participant');
        require(_seller != _buyer, 'Seller and buyer must differ');
        require(_price > 0, 'Price must be positive');
        require(_price >= _realtorFee, 'Price needs to be more than realtor fee!');

        realtor = _realtor;
        seller = _seller;
        buyer = _buyer;
        homeAddress = _address;
        zip = _zip;
        city = _city;
        price = _price;
        realtorFee = _realtorFee;
    }

    function sellerSignContract() public onlySeller inState(ContractState.WaitingSellerSignature) {
        contractState = ContractState.WaitingBuyerSignature;
        emit SellerSigned(msg.sender);
    }

    function buyerSignContractAndPayDeposit() public payable onlyBuyer inState(ContractState.WaitingBuyerSignature) {
        require(
            msg.value >= (price * DEPOSIT_PERCENTAGE) / 100 && msg.value <= price,
            'Buyer needs to deposit between 10% and 100% to sign contract'
        );

        contractState = ContractState.WaitingRealtorReview;
        deposit = msg.value;
        finalizeDeadline = block.timestamp + TIME_BETWEEN_DEPOSIT_AND_FINALIZATION;

        emit BuyerSigned(msg.sender, msg.value, finalizeDeadline);
    }

    function realtorReviewedClosingConditions(bool accepted) public onlyRealtor inState(ContractState.WaitingRealtorReview) {
        if (accepted) {
            closingConditionsReview = ClosingConditionsReview.Accepted;
            contractState = ContractState.WaitingFinalization;
            emit ClosingReviewed(true);
            return;
        }

        closingConditionsReview = ClosingConditionsReview.Rejected;
        contractState = ContractState.Rejected;
        _safeTransfer(buyer, deposit);

        emit ClosingReviewed(false);
        emit TransactionRejected(msg.sender);
    }

    function buyerFinalizeTransaction() public payable onlyBuyer inState(ContractState.WaitingFinalization) {
        require(msg.value == price - deposit, 'Buyer needs to pay the exact remaining cost');

        contractState = ContractState.Finalized;

        _safeTransfer(seller, price - realtorFee);
        _safeTransfer(realtor, realtorFee);

        emit Finalized(msg.sender, price, realtorFee);
    }

    function anyWithdrawFromTransaction() public inState(ContractState.WaitingFinalization) {
        require(
            msg.sender == buyer || msg.sender == seller || msg.sender == realtor,
            'Only transaction participants can withdraw'
        );
        require(msg.sender == buyer || finalizeDeadline <= block.timestamp, 'Only buyer can withdraw before transaction deadline');

        contractState = ContractState.Rejected;

        _safeTransfer(seller, deposit - realtorFee);
        _safeTransfer(realtor, realtorFee);

        emit TransactionRejected(msg.sender);
    }

    function _safeTransfer(address payable recipient, uint256 amount) internal {
        (bool success, ) = recipient.call{value: amount}('');
        require(success, 'Transfer failed');
    }
}
