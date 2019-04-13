const chai = require('chai')
const assert = chai.assert
const BigNumber = web3.BigNumber
const truffleAssert = require('truffle-assertions')
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

contract.only('RainbowDotMarket', ([deployer, seller, buyer, ...members]) => {
  let tokenName = 'Indexmine Token'
  let tokenSymbol = 'IPT'
  let decimals = 18

  context('Accounts can register as a seller by staking IPT', async () => {
    // for league
    let leagueName = 'testLeague'
    // for season
    let currentTime = Math.floor(Date.now() / 1000)
    let seasonName = 'testSeason'
    // for forecast
    let testTargetPrice = 35000
    let nonce = 0
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
    let sellCount = 3

    before(async () => {
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
        let bytesTargetPrice = web3.utils.soliditySha3(testTargetPrice, nonce)

        sealedForecast = await rainbowDotLeague.sealedForecast(seasonName, code, targetPeriod, bytesTargetPrice, { from: seller })
        // get forecastId for rest of process
        sealedForecastId = sealedForecast.logs[0].args.forecastId
      })
    })
    describe('registerLeague()', async () => {
      it('should register league to market', async () => {
        await rainbowDotMarket.registerLeague(leagueName, rainbowDotLeague.address)
        // await rainbowDotLeague.revealForecast(seasonName, sealedForecastId, testTargetPrice, nonce)

        // let forecastInfoFromLeague = await rainbowDotMarket.getForecastFromLeague(leagueName, seasonName, sealedForecastId, { from: seller })

        // assert.equal(0, forecastInfoFromLeague._targetPrice)
      })
      it('should find that the league is registered or not', async () => {
        let isRegistered = await rainbowDotMarket.isRegistered(leagueName)

        assert.equal(isRegistered, true)
      })
    })
    describe('stake()', async () => {
      it('should stake IPT for registering as a seller', async () => {
        await interpinesToken.approve(rainbowDotMarket.address, stakingPrice, { from: seller })
        await rainbowDotMarket.stake(stakingPrice, sealedForecastId, sellCount, { from: seller })

        let stakedBalance = await interpinesToken.balanceOf(rainbowDotMarket.address)

        assert.equal(stakedBalance, stakingPrice)

        let isStakedFromSeller = await rainbowDotMarket.getStake(seller, sealedForecastId)

        assert.equal(isStakedFromSeller, stakingPrice)
      })
    })
    describe('getItem()', async () => {
      it('should get item from item list', async () => {
        let itemInfo = await rainbowDotMarket.getItem(sealedForecastId, buyer)

        console.log('sold out : ', itemInfo._soldOut.toNumber())
      })
    })
    describe('order() & sell()', async () => {
      it('should register item to buy', async () => {
        await interpinesToken.approve(rainbowDotMarket.address, buyingPrice, { from: buyer })
        await rainbowDotMarket.order(buyingPrice, sealedForecastId, { from: buyer })
        let itemList = await rainbowDotMarket.getItemList()

        assert.equal(itemList[0], sealedForecastId)

        let itemInfo = await rainbowDotMarket.getItem(sealedForecastId, buyer)

        console.log('sold out : ', itemInfo._soldOut.toNumber())
      })
      it('should sell (incomplete)', async () => {
        let forecastInfo1 = await rainbowDotLeague.getForecast(seasonName, sealedForecastId)
        console.log('forecast hashedTargetPrice: ', forecastInfo1._hashedTargetPrice)
        let forecastInfo = await rainbowDotMarket.getForecastFromLeague(leagueName, seasonName, sealedForecastId, { from: seller })
        // TODO: reHashedValue should make by the decrypted value which is the getForecastFromLeague's _hashedTargetPrice
        let reHashedValue = forecastInfo._hashedTargetPrice
        console.log('reHashedValue: ', reHashedValue)
        // TODO: this line should make by decrypted value of _hashedTargetPrice
        let encryptedValue = web3.utils.soliditySha3(testTargetPrice, nonce)
        await rainbowDotMarket.sell(leagueName, seasonName, sealedForecastId, buyer, encryptedValue, reHashedValue, { from: seller })

        let itemInfo = await rainbowDotMarket.getItem(sealedForecastId, buyer)

        console.log('sold out : ', itemInfo._soldOut.toNumber())

        let buyerRemainingBalance = await interpinesToken.balanceOf(buyer)
        let sellerRemainingBalance = await interpinesToken.balanceOf(seller)

        assert.equal(buyerBalance - buyingPrice, buyerRemainingBalance)
        assert.equal(sellerBalance - stakingPrice + buyingPrice, sellerRemainingBalance)
      })
      it('should return staked balance to seller when sold out is sell count.', async () => {
        await interpinesToken.approve(rainbowDotMarket.address, buyingPrice, { from: buyer })
        await rainbowDotMarket.order(buyingPrice, sealedForecastId, { from: buyer })

        let forecastInfo = await rainbowDotMarket.getForecastFromLeague(leagueName, seasonName, sealedForecastId, { from: seller })
        let reHashedValue = forecastInfo._hashedTargetPrice
        let encryptedValue = web3.utils.soliditySha3(testTargetPrice, nonce)
        await rainbowDotMarket.sell(leagueName, seasonName, sealedForecastId, buyer, encryptedValue, reHashedValue, { from: seller })

        await interpinesToken.approve(rainbowDotMarket.address, buyingPrice, { from: buyer })
        await rainbowDotMarket.order(buyingPrice, sealedForecastId, { from: buyer })
        await rainbowDotMarket.sell(leagueName, seasonName, sealedForecastId, buyer, encryptedValue, reHashedValue, { from: seller })

        let balance1 = await interpinesToken.balanceOf(seller)
        console.log('seller balance : ', balance1.toNumber())

        await rainbowDotMarket.payBack(sealedForecastId, { from: seller })

        let marketBalance = await interpinesToken.balanceOf(rainbowDotMarket.address)
        console.log('market balance : ', marketBalance.toNumber())

        let balance2 = await interpinesToken.balanceOf(seller)
        console.log('seller balance : ', balance2.toNumber())
        assert.equal(sellerBalance + stakingPrice, balance2.toNumber())
      })
      it('shouldn\'t sell when the sellCount is 0', async () => {
        await interpinesToken.approve(rainbowDotMarket.address, buyingPrice, { from: buyer })
        await rainbowDotMarket.order(buyingPrice, sealedForecastId, { from: buyer })

        let forecastInfo = await rainbowDotMarket.getForecastFromLeague(leagueName, seasonName, sealedForecastId, { from: seller })
        let reHashedValue = forecastInfo._hashedTargetPrice
        let encryptedValue = web3.utils.soliditySha3(testTargetPrice, nonce)

        await truffleAssert.reverts(rainbowDotMarket.sell(
          leagueName, seasonName, sealedForecastId,
          buyer, encryptedValue, reHashedValue, { from: seller }), revertMsg)
      })
    })
  })
})
