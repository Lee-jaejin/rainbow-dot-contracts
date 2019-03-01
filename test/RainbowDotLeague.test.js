const chai = require('chai')
const BigNumber = web3.BigNumber
chai.use(require('chai-bignumber')(BigNumber)).should()

const RainbowDotCommittee = artifacts.require('RainbowDotCommittee')
const RainbowDotLeague = artifacts.require('RainbowDotLeague')
const RainbowDot = artifacts.require('RainbowDot')
let rainbowDot
let rainbowDotCommittee
let rainbowDotLeague

contract('RainbowDotLeague', function ([deployer, oracle, user, seller, buyer, ...members]) {
  context('When a league is once deployed successfully', async () => {
    // for season
    let seasonName = 'testSeason'
    let currentTime = Math.floor(Date.now() / 1000)
    // for forecast
    let testTargetPrice1 = 35000
    let testTargetPrice2 = 23000
    let nonce = 0
    let code = 1
    let targetPeriod = 100
    let agendaId
    let sealedForecastId
    let sealedForecast

    before(async () => {
      // Deploy rainbow dot first
      rainbowDot = await RainbowDot.new(members)

      // Get committee which is deployed during the RainbowDot contract's deployment
      let commiteeAddress = await rainbowDot.committee()
      rainbowDotCommittee = await RainbowDotCommittee.at(commiteeAddress)

      // Deploy a new league & register it to the rainbow dot
      rainbowDotLeague = await RainbowDotLeague.new(deployer, 'Indexmine Cup')
      await rainbowDotLeague.register(rainbowDot.address, { from: deployer })

      // add user
      await rainbowDot.join({ from: user })

      let eventFilter = rainbowDotCommittee.NewAgenda()

      await eventFilter.on('data', async (result) => {
        agendaId = result.args.agendaId.toNumber() // undefined

        // this won't work because of truffle 5's changing
        for (let i = 0; i < members.length; i++) {
          await rainbowDotCommittee.vote(agendaId, true, { from: members[i] })
        }
      })

      let onResult = rainbowDotCommittee.OnResult()
      await onResult.on('data', async (result) => {
        assert.equal(result.args.result, true)
        assert.equal(await rainbowDot.isApprovedLeague(rainbowDotLeague.address), true)
      })

      for (let i = 0; i < members.length; i++) {
        // TODO: should get agendaId from event 'NewAgenda'
        await rainbowDotCommittee.vote(0, true, { from: members[i] })
      }

      let isApproved = await rainbowDot.isApprovedLeague(rainbowDotLeague.address)
      console.log('isApproved? : ', isApproved)

      await rainbowDotLeague.newSeason(seasonName, code, currentTime + 10, currentTime + 30000, 10, 2, { from: deployer })
    })
    describe('waiting for season start', async () => {
      it('wait 11 seconds', function (done) {
        setTimeout(function () {
          console.log('waiting over')
          done()
        }, 11000)
      })
    })
    describe('openedForecast()', async () => {
      it('should register opened forecast', async () => {
        await rainbowDotLeague.openedForecast(seasonName, code, targetPeriod, testTargetPrice2, { from: user })
      })
    })
    describe('sealedForecast()', async () => {
      it('should register sealed forecast', async () => {
        let bytesTargetPrice = web3.utils.soliditySha3(testTargetPrice1, nonce)

        sealedForecast = await rainbowDotLeague.sealedForecast(seasonName, code, targetPeriod, bytesTargetPrice, { from: user })
        sealedForecastId = sealedForecast.logs[0].args.forecastId
      })
    })
    describe('revealForecast()', async () => {
      it('should reveal sealed forecast', async () => {
        console.log('sealed forecast id : ', sealedForecastId)

        await rainbowDotLeague.revealForecast(seasonName, sealedForecastId, testTargetPrice1, nonce)
      })
    })
    describe('getForecasts()', async () => {
      it('should get forecast list', async () => {
        let forecastList = await rainbowDotLeague.getForecasts(seasonName)

        console.log('forecast list : ', forecastList)
      })
    })
    describe('getForecast()', async () => {
      it('should get forecast info', async () => {
        let forecastInfo = await rainbowDotLeague.getForecast(seasonName, sealedForecastId)

        console.log('forecast info : ', forecastInfo)
      })
    })
    describe('close()', async () => {
      it('should start a new season')
    })
  })
})
