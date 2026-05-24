const AgriMarketplace = artifacts.require("AgriMarketplace");

module.exports = function (deployer) {
  deployer.deploy(AgriMarketplace);
};