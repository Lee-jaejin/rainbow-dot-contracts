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
        uint256 sellCount;
        uint256 soldOut;
        mapping (address => bool) cancelled;
        mapping (address => uint256) payment;
        mapping (address => bool) reader;
        mapping (address => bytes32) encryptedValue;
    }

    event Sold(address indexed seller, address indexed buyer, uint256 payment, bytes32 forecastId, uint256 sellCount, uint256 soldOut);

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

    function getForecastsFromLeague(string _leagueName, string _seasonName) public view returns (bytes32[] memory) {
        return leagues[_leagueName].getForecasts(_seasonName);
    }

    // before calling function sell()
    function getForecastFromLeague(string _leagueName, string _seasonName, bytes32 _forecastId) public view returns (
        address _user,
        uint256 _code,
        uint256 _rDots,
        uint256 _startFrame,
        uint256 _targetFrame,
        bytes32 _hashedTargetPrice,
        uint256 _targetPrice
    ) {
        Item storage item = items[_forecastId];

        if (msg.sender == item.seller) {
            (
                _user,
                _code,
                _rDots,
                _startFrame,
                _targetFrame,
                _hashedTargetPrice,
                _targetPrice
            ) = leagues[_leagueName].getForecastByMarket(_seasonName, _forecastId);
        } else {
            (
                _user,
                _code,
                _rDots,
                _startFrame,
                _targetFrame,
                _hashedTargetPrice,
                _targetPrice
            ) = leagues[_leagueName].getForecastByMarket(_seasonName, _forecastId);

            require(item.encryptedValue[msg.sender] != bytes32(0));

            _hashedTargetPrice = item.encryptedValue[msg.sender];
        }
    }

    function stake(uint256 _amount, bytes32 _forecastId, uint256 _sellCount) public {
        uint256 staking = interpines.allowance(msg.sender, address(this));
        require(staking >= _amount);

        interpines.transferFrom(msg.sender, address(this), _amount);
        guarantee[msg.sender][_forecastId] = _amount;

        Item storage item = items[_forecastId];
        item.seller = msg.sender;
        item.sellCount = _sellCount;
        item.soldOut = 0;
        item.forecastId = _forecastId;
        item.reader[msg.sender] = true;
        itemList.push(_forecastId);
    }

    function getItemList() public view returns (bytes32[] memory) {
        return itemList;
    }

    function getItem(bytes32 _forecastId, address _buyer) public view returns (
        address _seller,
        uint256 _sellCount,
        uint256 _soldOut,
        bool _cancelled,
        uint256 _payment,
        bool _reader
    ) {
        Item storage item = items[_forecastId];

        _seller = item.seller;
        _sellCount = item.sellCount;
        _soldOut = item.soldOut;
        _cancelled = item.cancelled[_buyer];
        _payment = item.payment[_buyer];
        _reader = item.reader[_buyer];
    }

    function getStake(address _user, bytes32 _forecastId) public view returns (uint256) {
        return guarantee[_user][_forecastId];
    }

    function order(uint256 _payment, bytes32 _forecastId) public {
        uint256 staking = interpines.allowance(msg.sender, address(this));
        require(staking >= _payment);
        require(_payment > 0);

        interpines.transferFrom(msg.sender, address(this), _payment);
        Item storage item = items[_forecastId];
        item.payment[msg.sender] = _payment;
    }

    function cancel(bytes32 _forecastId) public {
        Item storage item = items[_forecastId];
        require(item.payment[msg.sender] != 0);
        require(!item.cancelled[msg.sender]);

        item.cancelled[msg.sender] = true;
        interpines.transfer(msg.sender, item.payment[msg.sender]);
    }

    function sell(
        string _leagueName,
        string _seasonName,
        bytes32 _forecastId,
        address _buyer,
        bytes32 _encryptedValue,
        bytes32 _reHashedValue
    ) public {
        Item storage item = items[_forecastId];

        require(item.seller == msg.sender);
        require(!item.cancelled[_buyer]);
        require(item.soldOut < item.sellCount);

        bytes32 _hashedTargetPrice = leagues[_leagueName].getHashedPrice(_seasonName, _forecastId);

        require(_hashedTargetPrice == _reHashedValue, "invalid hashedTargetPrice!");

        item.encryptedValue[_buyer] = _encryptedValue;
        interpines.transfer(item.seller, item.payment[_buyer]);
        item.reader[_buyer] = true;
        item.soldOut = item.soldOut.add(1);

        emit Sold(item.seller, _buyer, item.payment[_buyer], _forecastId, item.sellCount, item.soldOut);
    }

    function payBack(bytes32 _forecastId) public {
        Item storage item = items[_forecastId];

        require(item.seller == msg.sender, "you are not permitted");
        require(item.soldOut == item.sellCount, "items have not been sold yet");

        interpines.transfer(item.seller, guarantee[item.seller][_forecastId]);
    }
}
