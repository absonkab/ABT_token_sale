const ABSToken = artifacts.require("ABSToken");
const ABSCrowdsale = artifacts.require("ABSCrowdsale");

module.exports = async function(deployer, network, accounts) {
    //deploy token contract
    await deployer.deploy(ABSToken, "ABSON TEST TOKENS", "ABT", "100000000000000000000000000000");
    const token = await ABSToken.deployed();

    //deploy crowdsale contract
    await deployer.deploy(ABSCrowdsale, 1000000000, "0xA40E51620faC81CA03acfB378F24a48cbD41D574", token.address);
    const crowdsale = await ABSCrowdsale.deployed();

    //calculate tokens amount to sale in ICO
    const totalSupply = await token.totalSupply();
    const tokenAvailable = totalSupply - 10000000000;

    //transfer token to crowdsale adresse
    token.transfer(crowdsale.address, tokenAvailable)
};