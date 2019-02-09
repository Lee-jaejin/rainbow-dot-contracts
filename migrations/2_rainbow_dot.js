var RainbowDot = artifacts.require('./RainbowDot.sol')

module.exports = async function (deployer, network, accounts) {
  let committee = accounts.slice(0, 1)
  deployer.deploy(RainbowDot, committee, { from: accounts[0] })
    .then(function (rainbowDot) {
      console.log('rainbowDot address : ', rainbowDot.address)
    })
}
