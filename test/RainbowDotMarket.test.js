const chai = require('chai')
const assert = chai.assert
const BigNumber = web3.BigNumber
chai.use(require('chai-bignumber')(BigNumber)).should()

const RainbowDotMarket = artifacts.require('RainbowDotMarket')
const InterpinesToken = artifacts.require('InterpinesToken')
let rainbowDotMarket
let interpinesToken

contract('RainbowDotMarket', ([deployer, seller, buyer, ...members]) => {
  let tokenName = 'Indexmine Token'
  let tokenSymbol = 'IPT'
  let decimals = 18

  context.only('Accounts can register as a seller by staking IPT', async () => {
    let sellerBalance = 10000000
    let buyerBalance = 10000000

    before(async () => {
      interpinesToken = await InterpinesToken.new(tokenName, tokenSymbol, decimals, { from: deployer })
      rainbowDotMarket = await RainbowDotMarket.new(interpinesToken.address)
      // initial mint to seller and buyer
      await interpinesToken.mint(seller, sellerBalance, { from: deployer })
      await interpinesToken.mint(buyer, buyerBalance, { from: deployer })
    })
    describe('stake()', async () => {
      it('should stake IPT for registering as a seller', async () => {
        let price = 100
        await interpinesToken.approve(rainbowDotMarket.address, price, { from: seller })
        await rainbowDotMarket.stake(price, '0x123456789', { from: seller })

        let stakedBalance = await interpinesToken.balanceOf(rainbowDotMarket.address)

        assert.equal(stakedBalance, price)

        let isStakedFromSeller = await rainbowDotMarket.getStake(seller)

        assert.equal(isStakedFromSeller, price)
      })
    })
    describe('order() & sell()', async () => {
      let itemId

      it('should register item to buy', async () => {
        let price = 40
        let hashedTargetPrice = '0x123456789'
        await interpinesToken.approve(rainbowDotMarket.address, price, { from: buyer })
        let receipt = await rainbowDotMarket.order(hashedTargetPrice, seller, price, { from: buyer })

        itemId = receipt.logs[0].args.id

        console.log('item id : ', itemId.toNumber())
      })
      it('should sell (incomplete)', async () => {
        let targetPrice = 55400
        let receipt = await rainbowDotMarket.sell(itemId, targetPrice, { from: seller })

        console.log('receipt : ', receipt.logs[0].args)
      })
    })
  })
  context('Buyer can ask to buy sealed forecast after registration of their public keys', async () => {
    it('should emit Events to notify to the sellers')
  })
  context('Challenge system works with oracle service before the on-chain RSA encryption solution created', async () => {
    it('should configure its challenge fee')
    it('should be able to change the oracle provider')
    it('should deposit a challenge fee')
    it('should slash and give the seller\'s stake to the challenger when the oracle provider judged the transaction a fraud')
    it('should give commission fee to the oracle provider')
  })
})
