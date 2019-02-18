var InterpinesToken = artifacts.require('./InterpinesToken.sol')

module.exports = async function (deployer, network, accounts) {
  let tokenName = 'Indexmine Token'
  let tokenSymbol = 'IPT'
  let decimals = 18
  deployer.deploy(InterpinesToken, tokenName, tokenSymbol, decimals, { from: accounts[0] })
    .then(function (token) {
      console.log('token address : ', token.address)
    })
}
