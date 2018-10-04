const chai = require('chai');
const assert = chai.assert;
const BigNumber = web3.BigNumber;
const should = chai.use(require('chai-bignumber')(BigNumber)).should();

// const League  = artifacts.require("League");
const Season  = artifacts.require("Season");
//
contract('Season', function([_, deployer, owner]) {
    it('test', async () => {
        let season = await Season.new({from:owner});
        console.log(season.address);
        let deployedSeason = await Season.at(season.address);
    })
});
//     context('When a Season contract is deployed by a League contract' , async() => {
//         let league;
//         let genesisSeason;
//         const LEAGUE_NAME = 'Rainbow Dot League';
//
//         it('should assign the EOA as its owner', async()=> {
//             league = await League.new(LEAGUE_NAME, {from:owner});
//             assert.equal(owner, await league.owner());
//         });
//
//         it('should receive a string value and store it as its name', async()=> {
//             assert.equal(LEAGUE_NAME, await league.name());
//         });
//
//         it('should deploy a new season contract internally, and assign it as its genesis season', async()=> {
//             genesisSeason = Season.at(await league.currentSeason());
//             assert.notEqual('0x0000000000000000000000000000000000000000', genesisSeason.address);
//         });
//     });
//
//     context('When a League is once deployed successfully', async() => {
//         let league;
//         const LEAGUE_NAME = 'Indexmine Cup';
//         beforeEach(async()=> {
//             league = await League.new(LEAGUE_NAME, {from:owner});
//         });
//         it('cannot start a season when the current season is not finished', async() => {
//             let currentSeason = Season.at(await league.currentSeason());
//             assert.notEqual('finished', currentSeason.status());
//             try {
//                 await league.startNewSeason();
//                 assert.fail('started a new season even the current season is not finished');
//             }catch (error) {
//                 assert.ok('failed to start a new season appropriately');
//             }
//         });
//     });
// });
