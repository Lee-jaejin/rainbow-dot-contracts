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

    mapping (address => uint256) pos;
    mapping (bytes32 => Item) items;
    mapping (string => RainbowDotLeague) leagues;

    struct Item {
        bytes32 forecastId;
        address seller;
        uint256 sellCount;
        mapping (address => bool) cancelled;
        mapping (address => uint256) payment;
        mapping (address => bool) reader;
    }

    event Sold(address indexed seller, address indexed buyer, uint256 payment, bytes32 forecastId);

    constructor (address _interpines) {
        interpines = IERC20(_interpines);
    }

    function registerLeague(string _leagueName, address _rainbowDotLeague) public {
        leagues[_leagueName] = RainbowDotLeague(_rainbowDotLeague);
    }

    function getForecastsFromLeague(string _leagueName) public view returns (bytes32[] memory) {
        return leagues[_leagueName].getForecasts(_leagueName);
    }

    function getForecastFromLeague(string _leagueName, bytes32 _forecastId) public view returns (
        address _user,
        uint256 _code,
        uint256 _rDots,
        uint256 _startFrame,
        uint256 _targetFrame,
        bytes32 _hashedTargetPrice,
        uint256 _targetPrice
    ) {
        Item storage item = items[_forecastId];

        (
            _user,
            _code,
            _rDots,
            _startFrame,
            _targetFrame,
            _hashedTargetPrice,
            _targetPrice
        ) = leagues[_leagueName].getForecast(_leagueName, _forecastId);

        if (!item.reader[msg.sender]) {
            _targetPrice = 0;
        }
    }

    function stake(uint256 _amount, bytes32 _forecastId, uint256 _sellCount) public {
        uint256 staking = interpines.allowance(msg.sender, address(this));
        require(staking >= _amount);
        interpines.transferFrom(msg.sender, address(this), _amount);
        pos[msg.sender] = pos[msg.sender].add(_amount);

        Item storage item = items[_forecastId];
        item.seller = msg.sender;
        item.sellCount = _sellCount;
        item.forecastId = _forecastId;
        item.reader[msg.sender] = true;
        itemList.push(_forecastId);
    }

    function getItemList() public view returns (bytes32[] memory) {
        return itemList;
    }

    function getStake(address _user) public view returns (uint256) {
        return pos[_user];
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

    function sell(bytes32 _forecastId, address _buyer) public {
        Item storage item = items[_forecastId];

        require(item.seller == msg.sender);
        require(!item.cancelled[_buyer]);
        require(item.sellCount != 0);

        item.reader[_buyer] = true;
        interpines.transfer(item.seller, item.payment[_buyer]);
        item.sellCount.sub(1);

        if (item.sellCount == 0) {
            interpines.transfer(item.seller, pos[item.seller]);
        }

        emit Sold(item.seller, _buyer, item.payment[_buyer], _forecastId);
    }
}
