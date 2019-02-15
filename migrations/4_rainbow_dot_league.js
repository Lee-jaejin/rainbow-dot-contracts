var RainbowDotLeague = artifacts.require('./RainbowDotLeague.sol')

module.exports = async function (deployer, network, accounts) {
  let leagueName = 'testLeague'

  const oracle = require('../build/contracts/Oracle')
  console.log('oracle address : ', oracle.networks[5777].address)

  const oracleAddress = oracle.networks[5777].address

  deployer.deploy(RainbowDotLeague, oracleAddress, leagueName)
    .then(function (rainbowDotLeague) {
      console.log('rainbowDotLeague address : ', rainbowDotLeague.address)
    })
}
