pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/access/Roles.sol";
import "ethereum-datetime/contracts/DateTime.sol";
import "./interfaces/IRainbowDotAccount.sol";

contract RainbowDotAccount is DateTime, IRainbowDotAccount {
    using Roles for Roles.Role;
    using SafeMath for uint256;

    uint256 constant public INITIAL_SUPPLY = 20;
    uint256 constant public MONTHLY_SUPPLY = 10;

    uint256 private _startedTime;
    uint256 private _lastSeasonNumber;
    int256[] gradingStandards;

    constructor () public Secondary() {
        _startedTime = now;
        gradingStandards = new int256[](6);
    }

    function addUser(address _user) public onlyPrimary {
        require(!users.has(_user));
        users.add(_user);
        userList.push(_user);
        Account memory account;
        account.rDots = INITIAL_SUPPLY;
        account.lastUse = now;
        accounts[_user] = account;
    }

    function useRDots(address _user, uint256 _rDots) public onlyPrimary {
        require(_rDots <= getAvailableRDots(_user));
        Account storage account = accounts[_user];
        require(_rDots <= uint256(getGrade(_user)).add(1));
        account.rDots = getAvailableRDots(_user) - _rDots;
        account.lastUse = now;
    }

    function updateScore(address[] _users, int256[] _scores) public onlyPrimary {
        for (uint256 i = 0; i < _users.length; i++) {
            // Check integer overflow
            int256 currentValue = getCurrentSeasonScore(_users[i]);
            if (_scores[i] > 0) {
                require(currentValue + _scores[i] > _scores[i]);
            } else {
                require(currentValue + _scores[i] < currentValue);
            }
            // Update score
            accounts[_users[i]].rScores[_getCurrentSeasonNumber()] = currentValue + _scores[i];
        }
    }

    /**
    * @dev On chain sorting can only cover about 300 of address.
    */
    function updateGrade() public onlyPrimary {
        // TODO We should use truebit to sort scores
        // If the current season num is 3 and the last season num is 1,
        // update grade information and the set last season to 2
        if (_lastSeasonNumber + 1 < _getCurrentSeasonNumber()) {
            //            gradingStandards = _gradingStandards;
            // Set last season
            _lastSeasonNumber = _getCurrentSeasonNumber() - 1;
        }
    }

    function updateGradingStandard(int256[] memory _standards) public onlyPrimary {
        require(_standards.length == 6);
        for (uint i = 0; i < _standards.length; i++) {
            gradingStandards[i] = _standards[i];
        }
    }

    function exist(address _user) public view returns (bool) {
        return users.has(_user);
    }

    function getAccount(address _user) public view returns (
        uint256 rDots,
        int256 rScore,
        uint256 lastUse,
        Grade grade)
    {
        require(users.has(_user));
        Account memory account = accounts[_user];
        rDots = getAvailableRDots(_user);
        rScore = getCurrentSeasonScore(_user);
        lastUse = account.lastUse;
        grade = _calculateGrade(rScore);
    }

    function getAvailableRDots(address _user) public view returns (uint256) {
        require(users.has(_user));
        Account memory account = accounts[_user];
        if (account.rDots < MONTHLY_SUPPLY && !_isOnSameMonth(account.lastUse, now)) {
            //  on reset condition
            return MONTHLY_SUPPLY;
        } else {
            return account.rDots;
        }
    }

    function getGrade(address _user) public view returns (Grade) {
        return _calculateGrade(getCurrentSeasonScore(_user));
    }

    function getCurrentSeasonScore(address _user) public view returns (int256) {
        accounts[_user].rScores[_getCurrentSeasonNumber()];
    }

    function getScoreOfSpecificSeason(address _user, uint256 _seasonNum) public view returns (int256) {
        accounts[_user].rScores[_seasonNum];
    }


    function _isOnSameMonth(
        uint256 _timestamp1,
        uint256 _timestamp2
    ) internal pure returns (bool) {
        _DateTime memory dt1 = parseTimestamp(_timestamp1);
        _DateTime memory dt2 = parseTimestamp(_timestamp2);
        return (dt1.year == dt2.year && dt1.month == dt2.month);
    }

    function _getCurrentSeasonNumber() public view returns (uint256) {
        // 90 days
        return now.sub(_startedTime).div(7776000).add(1);
    }

    // temporal set grade
    function _calculateGrade(int256 _rScore) private view returns (Grade) {
        if (_rScore <= 3) {
            return Grade.PURPLE;
        } else if (3 < _rScore && _rScore <= 10) {
            return Grade.NAVY;
        } else if (10 < _rScore && _rScore <= 1000) {
            return Grade.BLUE;
        } else if (1000 < _rScore && _rScore <= 2000) {
            return Grade.GREEN;
        } else if (2000 < _rScore && _rScore <= 5000) {
            return Grade.ORANGE;
        } else if (5000 < _rScore && _rScore <= 10000) {
            return Grade.YELLOW;
        } else {
            return Grade.RED;
        }
    }
}
