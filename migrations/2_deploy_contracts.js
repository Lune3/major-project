const AgriAuction = artifacts.require("AgriAuction");

module.exports = function (deployer) {
  deployer.deploy(AgriAuction);
};