pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Types.sol";

contract RainbowDotMarket {
    using Forecast for Forecast.Object;
    using SafeMath for uint256;

    IERC20 public interpines;
    mapping(address => uint256) pos;
    Item[] items;
    bytes32[] public itemList;

    struct Item {
        bytes32 hashedTargetPrice;
        address seller;
        address buyer;
        uint256 payment;
        bytes encryptedValue;
        bool cancelled;
        bool sold;
        uint256 targetPrice;      // should remove
    }

    event Order(uint256 id, address indexed seller, address indexed buyer, bytes32 hash, uint256 payment);
    event Complete(address indexed seller, address indexed buyer, bytes32 hash, uint256 payment, uint256 targetPrice);      // should remove targetPrice

    constructor (address _interpines) {
        interpines = IERC20(_interpines);
    }

    function stake(uint256 _amount, bytes32 _forecastId) public {
        uint256 staking = interpines.allowance(msg.sender, address(this));
        require(staking >= _amount);
        interpines.transferFrom(msg.sender, address(this), _amount);
        pos[msg.sender] = pos[msg.sender].add(_amount);
        itemList.push(_forecastId);
    }

    function getItemList() public view returns (bytes32[] memory) {
        return itemList;
    }

    function getStake(address _user) public view returns (uint256) {
        return pos[_user];
    }

    function order(
        bytes32 _hashedTargetPrice,
        address _seller,
        uint256 _payment
    ) public returns (uint256 _itemId){
        uint256 staking = interpines.allowance(msg.sender, address(this));
        require(staking >= _payment);
        require(_payment > 0);
        interpines.transferFrom(msg.sender, address(this), _payment);
        items.push(Item(_hashedTargetPrice, _seller, msg.sender, _payment, new bytes(0), false, false, 0));
        _itemId = items.length - 1;
        emit Order(
            _itemId,
            _seller,
            msg.sender,
            _hashedTargetPrice,
            _payment
        );
    }

    function registerPublicKey(bytes32 _pubKey) public {
        //
    }

    function getPubKey(address _user) public view returns (bytes32) {

    }

    function cancel(uint256 _itemId) public {
        Item storage item = items[_itemId];
        require(item.buyer == msg.sender);
        require(!item.cancelled);
        require(!item.sold);
        require(item.payment > 0);
        item.cancelled = true;
        interpines.transfer(msg.sender, item.payment);
    }

    // TODO: 'uint256 _targetPrice' must be changed to 'bytes _value'
    function sell(uint256 _itemId, uint256 _targetPrice) public {
        Item storage item = items[_itemId];
        require(item.seller == msg.sender);
        require(!item.cancelled);
        require(!item.sold);
//        item.encryptedValue = _value;
        item.targetPrice = _targetPrice;
        item.sold = true;
        // TODO transfer to seller
        emit Complete(item.seller, item.buyer, item.hashedTargetPrice, item.payment, item.targetPrice);
    }

    function fraudProof(uint256 _itemId, bytes _decrypted, bytes _pubKey) public {
        //        require(_pubKeyToAddress(_pubKey) == msg.sender);
        Item storage item = items[_itemId];
        bytes memory encryptedValue = _encryptWithPublicKey(_decrypted, _pubKey);
        require(keccak256(encryptedValue) == keccak256(item.encryptedValue));
        require(keccak256(_decrypted) != item.hashedTargetPrice);

        //slash
        require(pos[item.seller] > 0);
        interpines.transfer(msg.sender, pos[item.seller]);
        pos[item.seller] = 0;
    }

    function getValue(uint256 itemId) public view returns (bytes) {
        Item storage item = items[itemId];
        require(item.buyer == msg.sender);
        require(item.encryptedValue.length != 0);
        return item.encryptedValue;
    }

    function _encryptWithPublicKey(bytes _value, bytes _pubKey) private returns (bytes){
        //TODO
        return new bytes(0);
    }

    function _pubKeyToAddress(bytes _pubKey) private pure returns (address){
        //TODO
        return address(0);
    }
}
