const chai = require('chai')
const assert = chai.assert
const BigNumber = web3.BigNumber
const truffleAssert = require('truffle-assertions')
const ethCrypto = require('eth-crypto')

chai.use(require('chai-bignumber')(BigNumber)).should()
const revertMsg = 'VM Exception while processing transaction: revert'

const RainbowDot = artifacts.require('RainbowDot')
const RainbowDotCommittee = artifacts.require('RainbowDotCommittee')
const RainbowDotLeague = artifacts.require('RainbowDotLeague')
const InterpinesToken = artifacts.require('InterpinesToken')
const RainbowDotMarket = artifacts.require('RainbowDotMarket')

let rainbowDot
let rainbowDotCommittee
let rainbowDotLeague
let interpinesToken
let rainbowDotMarket
// this is just for local test - ganache
let sellerPrivateKey = '0xb66a8ba3710319c35417452fb02d3a20460255e1fb67c0067d375df81d886294'
let buyerPrivateKey = '0x7b24d6956653a3410a006540f22616f5d2ced5e4ce6c3cb776b5c193a12d292a'

contract('RainbowDotMarket', ([deployer, seller, buyer, ...members]) => {
  let tokenName = 'Indexmine Token'
  let tokenSymbol = 'IPT'
  let decimals = 18

  context.only('Accounts can register as a seller by staking IPT', async () => {
    // for league
    let leagueName = 'testLeague'
    // for season
    let currentTime = Math.floor(Date.now() / 1000)
    let seasonName = 'testSeason'
    // for forecast
    let testTargetPrice = 35000
    let code = 1
    let targetPeriod = 100
    let agendaId
    let sealedForecast
    let sealedForecastId
    // for market
    let sellerBalance = 10000000
    let buyerBalance = 10000000
    let stakingPrice = 120
    let buyingPrice = 40
    let amount = 3
    let encryptedValue
    // for security
    let sellerPublicKey
    let buyerPublicKey

    before(async () => {
      // for test
      sellerPublicKey = await ethCrypto.publicKeyByPrivateKey(sellerPrivateKey)
      buyerPublicKey = await ethCrypto.publicKeyByPrivateKey(buyerPrivateKey)

      // Deploy rainbow dot first
      rainbowDot = await RainbowDot.new(members)

      // Get committee which is deployed during the RainbowDot contract's deployment
      let committeeAddress = await rainbowDot.committee()
      rainbowDotCommittee = await RainbowDotCommittee.at(committeeAddress)

      // Deploy a new league & register it to the rainbow dot
      rainbowDotLeague = await RainbowDotLeague.new(deployer, 'Indexmine Cup')

      let eventFilter = rainbowDotCommittee.NewAgenda()

      eventFilter.on('data', async (err, result) => {
        if (err) {
          console.log('error occurred! : ', err)
        }
        agendaId = result.args.agendaId.toNumber() // undefined
        console.log('test : ', agendaId)

        // this won't work because of truffle 5's changing
        for (let i = 0; i < members.length; i++) {
          await rainbowDotCommittee.vote(agendaId, true, { from: members[i] })
        }
      })

      await rainbowDotLeague.register(rainbowDot.address, { from: deployer })

      // add user
      await rainbowDot.join({ from: seller })

      let onResult = rainbowDotCommittee.OnResult()
      await onResult.on('data', async (result) => {
        assert.equal(result.args.result, true)
        assert.equal(await rainbowDot.isApprovedLeague(rainbowDotLeague.address), true)
      })

      for (let i = 0; i < members.length; i++) {
        await rainbowDotCommittee.vote(0, true, { from: members[i] })
      }

      let isApproved = await rainbowDot.isApprovedLeague(rainbowDotLeague.address)
      assert.equal(isApproved, true)

      // make new season for starting league
      await rainbowDotLeague.newSeason(seasonName, code, currentTime + 10, currentTime + 30000, 10, 2, { from: deployer })

      interpinesToken = await InterpinesToken.new(tokenName, tokenSymbol, decimals, { from: deployer })
      rainbowDotMarket = await RainbowDotMarket.new(interpinesToken.address)

      // initial mint to seller and buyer
      await interpinesToken.mint(seller, sellerBalance, { from: deployer })
      await interpinesToken.mint(buyer, buyerBalance, { from: deployer })
    })
    describe('waiting for season start', async () => {
      it('wait 11 seconds', function (done) {
        setTimeout(function () {
          console.log('waiting over')
          done()
        }, 11000)
      })
    })
    describe('sealedForecast()', async () => {
      it('should register sealed forecast', async () => {
        let encryted = await ethCrypto.encryptWithPublicKey(sellerPublicKey, testTargetPrice.toString())
        let str = ethCrypto.cipher.stringify(encryted)

        sealedForecast = await rainbowDotLeague.sealedForecast(seasonName, code, targetPeriod, str, { from: seller })
        // get forecastId for rest of process
        sealedForecastId = sealedForecast.logs[0].args.forecastId
      })
    })
    describe('registerLeague()', async () => {
      it('should register league to market', async () => {
        await rainbowDotMarket.registerLeague(leagueName, rainbowDotLeague.address)
      })
      it('should find that the league is registered or not', async () => {
        let isRegistered = await rainbowDotMarket.isRegistered(leagueName)

        assert.equal(isRegistered, true)
      })
    })
    describe('setItem()', async () => {
      it('should stake IPT for registering as a seller', async () => {
        await interpinesToken.approve(rainbowDotMarket.address, stakingPrice, { from: seller })
        await rainbowDotMarket.setItem(stakingPrice, sealedForecastId, amount, { from: seller })

        let stakedBalance = await interpinesToken.balanceOf(rainbowDotMarket.address)

        assert.equal(stakedBalance, stakingPrice)

        let isStakedFromSeller = await rainbowDotMarket.getGuarantee(seller, sealedForecastId)

        assert.equal(isStakedFromSeller, stakingPrice)
      })
    })
    describe('order() & sell()', async () => {
      it('should register item to buy', async () => {
        await interpinesToken.approve(rainbowDotMarket.address, buyingPrice, { from: buyer })
        await rainbowDotMarket.order(buyingPrice, sealedForecastId, '0x' + buyerPublicKey, { from: buyer })
        let itemList = await rainbowDotMarket.getItemList()

        assert.equal(itemList[0], sealedForecastId)
      })
      it('should sell (incomplete)', async () => {
        encryptedValue = await reEncryption(seasonName, sealedForecastId)

        await rainbowDotMarket.sell(sealedForecastId, buyer, encryptedValue, { from: seller })

        let buyerRemainingBalance = await interpinesToken.balanceOf(buyer)
        let sellerRemainingBalance = await interpinesToken.balanceOf(seller)

        assert.equal(buyerBalance - buyingPrice, buyerRemainingBalance)
        assert.equal(sellerBalance - stakingPrice + buyingPrice, sellerRemainingBalance)
      })
      it('should access to forecast info', async () => {
        let forecastInfo = await rainbowDotMarket.getItem(sealedForecastId, buyer)
        let decrpytedValue = await ethCrypto.decryptWithPrivateKey(buyerPrivateKey, forecastInfo._encryptedValue)

        assert.equal(testTargetPrice, decrpytedValue)
      })
      it('should return staked balance to seller when sold out is sell count.', async () => {
        await interpinesToken.approve(rainbowDotMarket.address, buyingPrice, { from: buyer })
        await rainbowDotMarket.order(buyingPrice, sealedForecastId, '0x' + buyerPublicKey, { from: buyer })
        await rainbowDotMarket.sell(sealedForecastId, buyer, encryptedValue, { from: seller })

        await interpinesToken.approve(rainbowDotMarket.address, buyingPrice, { from: buyer })
        await rainbowDotMarket.order(buyingPrice, sealedForecastId, '0x' + buyerPublicKey, { from: buyer })
        await rainbowDotMarket.sell(sealedForecastId, buyer, encryptedValue, { from: seller })

        await rainbowDotMarket.payBack(sealedForecastId, { from: seller })

        let balance = await interpinesToken.balanceOf(seller)
        console.log('seller balance : ', balance.toNumber())
        assert.equal(sellerBalance + stakingPrice, balance.toNumber())
      })
      it('shouldn\'t sell when the item amount is 0', async () => {
        await interpinesToken.approve(rainbowDotMarket.address, buyingPrice, { from: buyer })
        await rainbowDotMarket.order(buyingPrice, sealedForecastId, '0x' + buyerPublicKey, { from: buyer })

        await truffleAssert.reverts(rainbowDotMarket.sell(sealedForecastId, buyer, encryptedValue, { from: seller }), revertMsg)
      })
    })
  })
  async function reEncryption (seasonName, sealedForecastId) {
    let forecastInfo = await rainbowDotLeague.getForecast(seasonName, sealedForecastId, { from: seller })

    let decryptedValue = await ethCrypto.decryptWithPrivateKey(sellerPrivateKey, forecastInfo._hashedTargetPrice)

    let item = await rainbowDotMarket.getItem(sealedForecastId, buyer)
    let encryptedStructure = await ethCrypto.encryptWithPublicKey(item._publicKey.replace('0x', ''), decryptedValue)
    let encryptedValue = await ethCrypto.cipher.stringify(encryptedStructure)
    return encryptedValue
  }
})
