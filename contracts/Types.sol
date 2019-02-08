pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/access/Roles.sol";

library Forecast {
    struct Object {
        address user;
        uint256 code;
        uint256 rDots;
        uint256 startFrame;
        uint256 targetFrame;
        bytes32 hashedTargetPrice;
        uint256 targetPrice; // initial value is zero
    }

    function isInitialized(Object memory _object) internal pure returns (bool) {
        return (_object.hashedTargetPrice.length != 0);
    }

    function revealValue(Object storage _object, uint256 _value, uint256 _nonce) internal {
        require(keccak256(abi.encodePacked(_value, _nonce)) == _object.hashedTargetPrice);
        _object.targetPrice = _value;
    }
}

library Season {
    using Forecast for Forecast.Object;
    using SafeMath for uint256;
    using Roles for Roles.Role;
    struct Object {
        string name;
        uint256 code;
        uint256 startTime;
        uint256 finishTime;
        uint256 secondsPerFrame;
        uint256 framesPerPeriod; // how many frames per period
        uint256 timeTolerance;
        address[] userList;
        Roles.Role users; // TODO: mapping(address=>uint256) users; ??
        bytes32[] forecastList;
        mapping(bytes32 => Forecast.Object) forecasts;
        uint256[] usedFrames;
        mapping(uint256 => PriceData) priceData;
    }

    struct PriceData {
        bool hasForecast;
        uint256 timestamp;
        uint256 price;
    }

    function isInitialized(Object memory _object) internal pure returns (bool) {
        return (bytes(_object.name).length != 0);
    }

    function isOnGoing(Object memory _object) internal view returns (bool) {
        return (_object.startTime <= now && now <= _object.finishTime);
    }

    function getMaximumFrame(Object memory _object) internal pure returns (uint256) {
        return _object.finishTime.sub(_object.startTime).div(_object.secondsPerFrame);
    }

    function getFrame(Object memory _object, uint256 _timestamp) internal pure returns (uint256) {
        return _timestamp.sub(_object.startTime).div(_object.secondsPerFrame);
    }

    function addForecast(Object storage _object, Forecast.Object _forecast) internal returns (bytes32 forecastId) {
        forecastId = keccak256(
            abi.encodePacked(
                _forecast.user,
                _forecast.code,
                _forecast.rDots,
                _forecast.startFrame,
                _forecast.targetFrame,
                _forecast.hashedTargetPrice
            )
        );

        // Unique forecast id
        require(_object.forecasts[forecastId].isInitialized());

        // add forecast data
        _object.forecastList.push(forecastId);
        _object.forecasts[forecastId] = _forecast;

        // it needs a price data for the given starting time frame
        if (!_object.priceData[_forecast.startFrame].hasForecast) {
            _object.priceData[_forecast.startFrame].hasForecast = true;
            _object.usedFrames.push(_forecast.startFrame);
        }

        // it needs a price data for the given targeting time frame
        if (!_object.priceData[_forecast.targetFrame].hasForecast) {
            _object.priceData[_forecast.targetFrame].hasForecast = true;
            _object.usedFrames.push(_forecast.targetFrame);
        }

        // Add user to the list
        if (!_object.users.has(_forecast.user)) {
            _object.users.add(_forecast.user);
            _object.userList.push(_forecast.user);
        }
    }

    function addPriceData(Object storage _object, uint256 _timestamp, uint256 _price) internal {
        uint256 frameNumber = getFrame(_object, _timestamp);
        _object.priceData[frameNumber].timestamp = _timestamp;
        _object.priceData[frameNumber].price = _price;
    }

    function calculateResult(Object storage _object) internal view returns (address[] _users, int256[] _rScores) {
        _users = _object.userList;
        _rScores = new int256[](_users.length);

        for (uint i; i < _object.forecastList.length; i++) {
            Forecast.Object memory forecast = _object.forecasts[_object.forecastList[i]];
            uint256 startPrice = _object.priceData[forecast.startFrame].price;
            uint256 endPrice = _object.priceData[forecast.targetFrame].price;
            int256 rScore = calculateRScore(
                startPrice,
                forecast.targetPrice,
                endPrice,
                forecast.targetFrame.sub(forecast.startFrame).div(_object.secondsPerFrame),
                forecast.rDots
            );
            // TODO use mapping instead of list??

            // uint j = users[forecast.user]; // mapping(address=>uint) users;
            // _rScores[j] = +=rScore
            for (uint j; j < _users.length; j++) {
                if (_users[j] == forecast.user) {
                    _rScores[j] += rScore;
                    // TODO _rScores[forecast.user] += rScore;
                }
            }
        }
    }

    function calculateRScore(uint256 _startPrice, uint256 _forecastPrice, uint256 _realPrice, uint256 _periods, uint256 _rDots) public pure returns (int256) {
        require(_startPrice != 0);
        require(_forecastPrice != 0);
        require(_realPrice != 0);
        int256 realDiff = int256(_realPrice) - int256(_startPrice);
        int256 forecastDiff = int256(_forecastPrice) - int256(_startPrice);
        bool profit;
        if (realDiff == 0 && forecastDiff == 0) {
            profit = true;
        } else if (realDiff > 0 && forecastDiff > 0) {
            profit = true;
        } else if (realDiff < 0 && forecastDiff < 0) {
            profit = true;
        }
        int256 returnRate = realDiff * (profit ? int(100) : - 100) / int256(_startPrice);
        int bonus = 1;
        if (profit && realDiff != 0) {
            int256 errorRate = (forecastDiff - realDiff) * (forecastDiff > realDiff ? int(100) : - 100) / realDiff;
            if (errorRate < 10) {
                bonus = 5;
            } else if (errorRate < 20) {
                bonus = 4;
            } else if (errorRate < 30) {
                bonus = 5;
            } else if (errorRate < 40) {
                bonus = 2;
            }
        }
        return returnRate * bonus * int(_periods) * int(_rDots);
    }
}

contract MinterLeague {
    /**
     * @dev It returns the amount of token to mint at once.
     * RainbowDot mints new tokens when minter leagues return new season result
     */
    function mintPercentagePerSeason() public pure returns (uint256);
}
