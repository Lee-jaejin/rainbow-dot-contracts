var RainbowDotLeague = artifacts.require('./RainbowDotLeague.sol')

module.exports = async function (deployer, network, accounts) {
  let leagueName = 'testLeague'

  const oracle = require('../build/contracts/Oracle')
  const oracleAddress = oracle.networks[5777].address

  deployer.deploy(RainbowDotLeague, oracleAddress, leagueName, { from: accounts[0] })
    .then(function (rainbowDotLeague) {
      console.log('rainbowDotLeague address : ', rainbowDotLeague.address)
    })
}
