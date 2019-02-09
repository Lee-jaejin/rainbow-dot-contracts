var Oracle = artifacts.require('./Oracle.sol')

module.exports = async function (deployer, network, accounts) {
  deployer.deploy(Oracle, { from: accounts[0] })
    .then(function (oracle) {
      console.log('oracle address : ', oracle.address)
    })
}
