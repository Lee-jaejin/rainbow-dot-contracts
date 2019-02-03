'use strict'

const truffleContract = require('truffle-contract')

module.exports = {
  BasicToken: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.BasicToken)
    contract.setProvider(web3Provider)
    return contract
  },
  ComplexStorage: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.ComplexStorage)
    contract.setProvider(web3Provider)
    return contract
  },
  DateTime: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.DateTime)
    contract.setProvider(web3Provider)
    return contract
  },
  ECDSA: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.ECDSA)
    contract.setProvider(web3Provider)
    return contract
  },
  ERC20: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.ERC20)
    contract.setProvider(web3Provider)
    return contract
  },
  ERC20Basic: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.ERC20Basic)
    contract.setProvider(web3Provider)
    return contract
  },
  ERC20Detailed: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.ERC20Detailed)
    contract.setProvider(web3Provider)
    return contract
  },
  ERC20Mintable: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.ERC20Mintable)
    contract.setProvider(web3Provider)
    return contract
  },
  Forecast: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.Forecast)
    contract.setProvider(web3Provider)
    return contract
  },
  IERC20: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.IERC20)
    contract.setProvider(web3Provider)
    return contract
  },
  IRainbowDotAccount: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.IRainbowDotAccount)
    contract.setProvider(web3Provider)
    return contract
  },
  InterpinesToken: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.InterpinesToken)
    contract.setProvider(web3Provider)
    return contract
  },
  League: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.League)
    contract.setProvider(web3Provider)
    return contract
  },
  Migrations: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.Migrations)
    contract.setProvider(web3Provider)
    return contract
  },
  MinterLeague: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.MinterLeague)
    contract.setProvider(web3Provider)
    return contract
  },
  MinterRole: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.MinterRole)
    contract.setProvider(web3Provider)
    return contract
  },
  Oracle: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.Oracle)
    contract.setProvider(web3Provider)
    return contract
  },
  Ownable: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.Ownable)
    contract.setProvider(web3Provider)
    return contract
  },
  RainbowDot: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.RainbowDot)
    contract.setProvider(web3Provider)
    return contract
  },
  RainbowDotAccount: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.RainbowDotAccount)
    contract.setProvider(web3Provider)
    return contract
  },
  RainbowDotCommittee: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.RainbowDotCommittee)
    contract.setProvider(web3Provider)
    return contract
  },
  RainbowDotContract: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.RainbowDotContract)
    contract.setProvider(web3Provider)
    return contract
  },
  RainbowDotEndPriceLeague: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.RainbowDotEndPriceLeague)
    contract.setProvider(web3Provider)
    return contract
  },
  RainbowDotLeague: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.RainbowDotLeague)
    contract.setProvider(web3Provider)
    return contract
  },
  RainbowDotMarket: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.RainbowDotMarket)
    contract.setProvider(web3Provider)
    return contract
  },
  RainbowDotSeason: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.RainbowDotSeason)
    contract.setProvider(web3Provider)
    return contract
  },
  Roles: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.Roles)
    contract.setProvider(web3Provider)
    return contract
  },
  SafeMath: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.SafeMath)
    contract.setProvider(web3Provider)
    return contract
  },
  Season: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.Season)
    contract.setProvider(web3Provider)
    return contract
  },
  Secondary: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.Secondary)
    contract.setProvider(web3Provider)
    return contract
  },
  SimpleStorage: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.SimpleStorage)
    contract.setProvider(web3Provider)
    return contract
  },
  StandardToken: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.StandardToken)
    contract.setProvider(web3Provider)
    return contract
  },
  TutorialToken: function (web3Provider = undefined) {
    const contract = truffleContract(artifacts.TutorialToken)
    contract.setProvider(web3Provider)
    return contract
  }
}