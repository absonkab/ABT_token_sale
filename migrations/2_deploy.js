const ABSToken = artifacts.require("ABSToken");
const ABSCrowdsale = artifacts.require("ABSCrowdsale");

module.exports = async function(deployer, network, accounts) {
    await deployer.deploy(ABSToken, "ABSON TEST TOKENS", "ABT", "1000000000000000000000000000");
    const token = await ABSToken.deployed();

    await deployer.deploy(ABSCrowdsale, 1000000, accounts[0], token.address);
    //transfer token
    const crowdsale = await ABSCrowdsale.deployed();

    token.transfer(crowdsale.address, await token.totalSupply())
};