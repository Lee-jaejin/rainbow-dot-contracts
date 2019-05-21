pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Secondary.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Oracle.sol";
import "./RainbowDot.sol";
import {Season, Forecast} from "./Types.sol";
import "ethereum-datetime/contracts/DateTime.sol";
import "./RainbowDotLeague.sol";

contract RainbowDotEndPriceLeague is DateTime, RainbowDotLeague {

    constructor (address _oracle, string _description) public RainbowDotLeague(_oracle, _description) {
    }

    function openedForecast(string _season, uint256 _rDots, uint256 _days, uint256 _targetPrice) external returns (bytes32 forecastId) {
        //TODO grade limit
        return _forecastEndPrice(msg.sender, _season, _rDots, _days, "", _targetPrice);
    }

    function sealedForecast(string _season, uint256 _rDots, uint256 _days, string _targetPrice) external returns (bytes32 forecastId){
        // TODO grade limit
        return _forecastEndPrice(msg.sender, _season, _rDots, _days, _targetPrice, 0);
    }

    /**
     * @dev This function is used to predict the end price after the given days
     */
    function _forecastEndPrice(
        address _user,
        string _season,
        uint256 _rDots,
        uint256 _days,
        string _hashedTargetPrice,
        uint256 _targetPrice
    ) internal returns (bytes32 forecastId) {
        Season.Object storage season = seasons[_season];
        // Season should be initialized
        require(season.isInitialized());

        // Season should be on going
        require(season.isOnGoing());

        // Target timestamp can not be greater than the finish time of the season
        // Restrict the Target frame to the end of the day
        _DateTime memory targetDate = parseTimestamp(now + _days * 86400);
        uint256 targetTimestamp = toTimestamp(
            targetDate.year,
            targetDate.month,
            targetDate.day,
            24, 0, 0
        );
        uint256 targetFrame = season.getFrame(targetTimestamp);
        require(targetFrame <= season.getMaximumFrame());

        // Spend RDot
        takeRDot(_user, _rDots);

        // Create forecast object and add it to the Season object
        Forecast.Object memory forecast;
        forecast.user = _user;
        forecast.code = season.code;
        forecast.rDots = _rDots;
        forecast.startFrame = season.getFrame(now);
        forecast.targetFrame = targetFrame;
        forecast.hashedTargetPrice = _hashedTargetPrice;
        forecast.targetPrice = _targetPrice;
        forecastId = season.addForecast(forecast);
    }
}
