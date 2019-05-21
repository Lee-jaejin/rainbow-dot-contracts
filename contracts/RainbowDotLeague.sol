pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Secondary.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Oracle.sol";
import "./RainbowDot.sol";
import {Season, Forecast} from "./Types.sol";

contract RainbowDotLeague is Secondary {
    using SafeMath for uint256;
    using Forecast for Forecast.Object;
    using Season for Season.Object;

    uint256 constant MINIMUM_PERIODS_OF_SEASON = 100; // temporal

    Oracle public oracle;
    string description;
    RainbowDot rainbowDot;
    function(address, uint256) external takeRDot;
    function(address[] memory, int256[] memory) external onResult;
    string[] seasonList;
    mapping(string => Season.Object) seasons;

    modifier onlyRainbowDot {
        require(msg.sender == address(rainbowDot));
        _;
    }

    event EventForecastId(bytes32 forecastId);

    constructor (address _oracle, string _description) public Secondary() {
        oracle = Oracle(_oracle);
        description = _description;
    }

    function register(address _rainbowDot) public onlyPrimary {
        // Should not be assigned before
        require(address(rainbowDot) == address(0));
        // Assign
        rainbowDot = RainbowDot(_rainbowDot);
        // Submit agenda to get approval
        rainbowDot.requestLeagueRegistration(address(this), description);
    }

    function accept(function(address, uint256) external _takeRDot, function(address[] memory, int256[] memory) external _onResult) public onlyRainbowDot {
        takeRDot = _takeRDot;
        onResult = _onResult;
    }

    function isSeasonInit(string _name) public view returns (bool _isInit) {
        Season.Object storage season = seasons[_name];

        _isInit = season.isInitialized();
    }

    function isSeasonStarted(string _name) public view returns (bool _isStarted) {
        Season.Object storage season = seasons[_name];

        _isStarted = season.isOnGoing();
    }

    function newSeason(
        string _name,
        uint256 _code,
        uint256 _startTime,
        uint256 _finishTime,
        uint256 _secondsPerFrame,
        uint256 _framesPerPeriod
    ) public onlyPrimary {
        Season.Object storage season = seasons[_name];
        // Season list does not allow duplicates
        require(!season.isInitialized());

        // Creating a new season is only allowed for future forecasts.
        require(_startTime > now);
        require(_finishTime > _startTime);

        // Seasons can not be overlapped
        // TODO code
        if (seasonList.length > 0) {
            Season.Object storage lastSeason = seasons[seasonList[seasonList.length - 1]];
            require(lastSeason.finishTime <= _startTime);
        }

        // Frame uint should not be zero
        require(_secondsPerFrame != 0);

        // Set detail information of the season
        season.name = _name;
        season.code = _code;
        season.startTime = _startTime;
        season.finishTime = _finishTime;
        season.secondsPerFrame = _secondsPerFrame;
        season.framesPerPeriod = _framesPerPeriod;

        // Minimum period limit
        require(season.getMaximumFrame().div(_framesPerPeriod) >= MINIMUM_PERIODS_OF_SEASON);

        // Add the name of the season to the list
        seasonList.push(_name);
    }

    function openedForecast(string _season, uint256 _rDots, uint256 _periods, uint256 _targetPrice) external returns (bytes32 forecastId) {
        //TODO grade limit
        return _forecast(msg.sender, _season, _rDots, _periods, "", _targetPrice);
    }

    function sealedForecast(string _season, uint256 _rDots, uint256 _periods, string _targetPrice) external returns (bytes32 forecastId) {
        // TODO grade limit
        bytes32 _forecastId = _forecast(msg.sender, _season, _rDots, _periods, _targetPrice, 0);
        emit EventForecastId(_forecastId);
        forecastId = _forecastId;
    }

    function _forecast(
        address _user,
        string _season,
        uint256 _rDots,
        uint256 _periods,
        string _hashedTargetPrice,
        uint256 _targetPrice
    ) internal returns (bytes32 forecastId) {
        Season.Object storage season = seasons[_season];
        // Season should be initialized
        require(season.isInitialized());

        // Season should be on going
        require(season.isOnGoing());

        // Target timestamp can not be greater than the finish time of the season
        uint256 targetTimestamp = season.secondsPerFrame.mul(season.framesPerPeriod).mul(_periods).add(now);
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

    // revealForecast only can be called at end of season
    function revealForecast(string _season, bytes32 _forecastId, uint256 _value, uint _nonce) external {
        Season.Object storage season = seasons[_season];
        // Check initialization
        require(season.isInitialized());
        require(season.forecasts[_forecastId].isInitialized());
        // Commit value
        season.forecasts[_forecastId].revealValue(_value, _nonce);
    }

    function submitData(string _season, uint256 _timestamp, uint256 _code, uint256 _value, bytes _signature) public {
        Season.Object storage season = seasons[_season];
        // Check season data
        require(season.code == _code);
        require(season.startTime <= _timestamp);
        require(season.finishTime >= _timestamp);

        // Check signature
        require(oracle.isVerified(abi.encodePacked(_timestamp, _code, _value), _signature));

        // Check initialization
        require(season.isInitialized());

        // Check initialization
        season.addPriceData(season.getFrame(_timestamp), _value);
    }

    function close(string _season) public {
        Season.Object storage season = seasons[_season];
        // TODO penalties for unrevealed forecasts
        // Check initialization
        require(season.isInitialized());

        address[] memory users;
        int256[] memory rScores;
        (users, rScores) = season.calculateResult();
        onResult(users, rScores);
    }

    function getForecasts(string _season) public view returns (bytes32[] memory) {
        Season.Object storage season = seasons[_season];
        require(abi.encodePacked(season.name).length != 0);
        return season.forecastList;
    }

    function getForecast(string _season, bytes32 _forecastId) public view returns (
        address _user,
        uint256 _code,
        uint256 _rDots,
        uint256 _startFrame,
        uint256 _targetFrame,
        string _hashedTargetPrice,
        uint256 _targetPrice
    ) {
        Season.Object storage season = seasons[_season];
        require(abi.encodePacked(season.name).length != 0);

        Forecast.Object memory forecast = season.forecasts[_forecastId];
        require(abi.encodePacked(forecast.user).length != 0);

        _user = forecast.user;
        _code = forecast.code;
        _rDots = forecast.rDots;
        _startFrame = forecast.startFrame;
        _targetFrame = forecast.targetFrame;
        _hashedTargetPrice = forecast.hashedTargetPrice;
        _targetPrice = forecast.targetPrice;
    }
}
