var RainbowDotMarket = artifacts.require('./RainbowDotMarket.sol')

module.exports = async function (deployer, network, accounts) {
  const interpinesToken = require('../build/contracts/InterpinesToken')
  const tokenAddress = interpinesToken.networks[5777].address

  deployer.deploy(RainbowDotMarket, tokenAddress, { from: accounts[0] })
    .then(function (rainbowDotMarket) {
      console.log('rainbowDotMarket address : ', rainbowDotMarket.address)
    })
}
