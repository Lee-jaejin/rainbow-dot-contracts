pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./RainbowDotLeague.sol";
import "./Types.sol";

contract RainbowDotMarket {
    using Forecast for Forecast.Object;
    using Season for Season.Object;
    using SafeMath for uint256;

    RainbowDotLeague rainbowDotLeague;
    IERC20 public interpines;
    bytes32[] itemList;

    mapping (address => mapping (bytes32 => uint256)) guarantee;
    mapping (bytes32 => Item) items;
    mapping (string => RainbowDotLeague) leagues;
    mapping (string => bool) registered;

    struct Item {
        bytes32 forecastId;
        address seller;
        uint256 amount;
        mapping (address => bool) cancelled;
        mapping (address => uint256) payment;
        mapping (address => bool) reader;
        mapping (address => string) encryptedValue;
        mapping (address => bytes) publicKey;
    }

    event Sold(address indexed seller, address indexed buyer, uint256 payment, bytes32 forecastId, uint256 amount);

    constructor (address _interpines) {
        interpines = IERC20(_interpines);
    }

    function isRegistered(string _leagueName) public view returns (bool _registered) {
        _registered = registered[_leagueName];
    }

    function registerLeague(string _leagueName, address _rainbowDotLeague) public {
        leagues[_leagueName] = RainbowDotLeague(_rainbowDotLeague);
        registered[_leagueName] = true;
    }

    function setItem(uint256 _guarantee, bytes32 _forecastId, uint256 _amount) public {
        uint256 staking = interpines.allowance(msg.sender, address(this));
        require(staking >= _guarantee);

        interpines.transferFrom(msg.sender, address(this), _guarantee);
        guarantee[msg.sender][_forecastId] = _guarantee;

        Item storage item = items[_forecastId];
        item.seller = msg.sender;
        item.amount = _amount;
        item.forecastId = _forecastId;
        item.reader[msg.sender] = true;
        itemList.push(_forecastId);
    }

    function getItemList() public view returns (bytes32[] memory) {
        return itemList;
    }

    function getItem(bytes32 _forecastId, address _buyer) public view returns (
        address _seller,
        uint256 _amount,
        bool _cancelled,
        uint256 _payment,
        bool _reader,
        bytes _publicKey,
        string _encryptedValue
    ) {
        Item storage item = items[_forecastId];

        _seller = item.seller;
        _amount = item.amount;
        _cancelled = item.cancelled[_buyer];
        _payment = item.payment[_buyer];
        _reader = item.reader[_buyer];
        _publicKey = item.publicKey[_buyer];
        _encryptedValue = item.encryptedValue[_buyer];
    }

    function getGuarantee(address _user, bytes32 _forecastId) public view returns (uint256) {
        return guarantee[_user][_forecastId];
    }

    function order(uint256 _payment, bytes32 _forecastId, bytes _publicKey) public {
        uint256 staking = interpines.allowance(msg.sender, address(this));
        require(staking >= _payment);
        require(_payment > 0);
        require((uint(keccak256(_publicKey)) & 0x00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) == uint(msg.sender));

        interpines.transferFrom(msg.sender, address(this), _payment);
        Item storage item = items[_forecastId];
        item.payment[msg.sender] = _payment;
        item.publicKey[msg.sender] = _publicKey;
    }

    function cancel(bytes32 _forecastId) public {
        Item storage item = items[_forecastId];
        require(item.payment[msg.sender] != 0);
        require(!item.cancelled[msg.sender]);

        item.cancelled[msg.sender] = true;
        interpines.transfer(msg.sender, item.payment[msg.sender]);
    }

    function sell(
        bytes32 _forecastId,
        address _buyer,
        string _encryptedValue
    ) public {
        Item storage item = items[_forecastId];

        require(item.seller == msg.sender);
        require(!item.cancelled[_buyer]);
        require(item.amount != 0, "cannot sell anymore");

        item.encryptedValue[_buyer] = _encryptedValue;
        interpines.transfer(item.seller, item.payment[_buyer]);
        item.reader[_buyer] = true;
        item.amount = item.amount.sub(1);

        emit Sold(item.seller, _buyer, item.payment[_buyer], _forecastId, item.amount);
    }

    function payBack(bytes32 _forecastId) public {
        Item storage item = items[_forecastId];

        require(item.seller == msg.sender, "you are not permitted");
        require(item.amount == 0, "items have not been sold yet");

        interpines.transfer(item.seller, guarantee[item.seller][_forecastId]);
    }
}
