const chai = require('chai')
const BigNumber = web3.BigNumber
chai.use(require('chai-bignumber')(BigNumber)).should()

const RainbowDotCommittee = artifacts.require('RainbowDotCommittee')
const RainbowDotLeague = artifacts.require('RainbowDotLeague')
const RainbowDot = artifacts.require('RainbowDot')

contract('RainbowDotLeague', function ([deployer, oracle, user, ...members]) {
  context('When a league is once deployed successfully', async () => {
    let rainbowDot
    let committee
    let rainbowDotLeague
    let currentTime = Math.floor(Date.now() / 1000)
    let code = 1
    let seasonName = 'testSeason'
    let agendaId
    let forecastId

    before(async () => {
      // Deploy rainbow dot first
      rainbowDot = await RainbowDot.new(members)

      // Get committee which is deployed during the RainbowDot contract's deployment
      let commiteeAddress = await rainbowDot.committee()
      committee = await RainbowDotCommittee.at(commiteeAddress)

      // Deploy a new league & register it to the rainbow dot
      rainbowDotLeague = await RainbowDotLeague.new(deployer, 'Indexmine Cup')
      await rainbowDotLeague.register(rainbowDot.address, { from: deployer })

      // add user
      await rainbowDot.join({ from: user })

      let eventFilter = committee.NewAgenda()

      await eventFilter.on('data', async (result) => {
        agendaId = result.args.agendaId.toNumber() // undefined

        // this won't work because of truffle 5's changing
        for (let i = 0; i < members.length; i++) {
          await committee.vote(agendaId, true, { from: members[i] })
        }
      })

      let onResult = committee.OnResult()
      await onResult.on('data', async (result) => {
        assert.equal(result.args.result, true)
        assert.equal(await rainbowDot.isApprovedLeague(rainbowDotLeague.address), true)
      })

      for (let i = 0; i < members.length; i++) {
        // TODO: should get agendaId from event 'NewAgenda'
        await committee.vote(0, true, { from: members[i] })
      }

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
        let isApproved = await rainbowDot.isApprovedLeague(rainbowDotLeague.address)
        console.log('isApproved? : ', isApproved)

        await rainbowDotLeague.openedForecast(seasonName, 1, 100, 35000, { from: user })
      })
    })
    describe('sealedForecast()', async () => {
      it('should register sealed forecast', async () => {
        let isApproved = await rainbowDot.isApprovedLeague(rainbowDotLeague.address)
        console.log('isApproved? : ', isApproved)

        let bytesTargetPrice = web3.utils.soliditySha3(35000, 0)

        await rainbowDotLeague.sealedForecast(seasonName, 1, 100, bytesTargetPrice, { from: user })
      })
    })
    describe('revealForecast()', async () => {
      it('should reveal sealed forecast', async () => {
        let bytesTargetPrice = web3.utils.soliditySha3(35000, 0)

        let sealedForecastId = await rainbowDotLeague.sealedForecast(seasonName, 1, 100, bytesTargetPrice, { from: user })

        forecastId = sealedForecastId.logs[0].args.forecastId
        console.log('sealed forecast id : ', forecastId)

        await rainbowDotLeague.revealForecast(seasonName, forecastId, 35000, 0)
      })
    })
    describe('close()', async () => {
      it('should start a new season')
    })
  })
})
