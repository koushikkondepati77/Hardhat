// test/gasPriceEstimationTest.js

const { expect } = require("chai");

describe("GasPriceEstimation", function () {
  let gasPriceEstimation;

  before(async () => {
    const GasPriceEstimation = await ethers.getContractFactory("GasPriceEstimation");
    gasPriceEstimation = await GasPriceEstimation.deploy();
    await gasPriceEstimation.deployed();
  });

  it("should return a non-zero maxPriorityFeePerGas", async function () {
    const maxPriorityFeePerGas = await gasPriceEstimation.maxPriorityFeePerGas();
    expect(maxPriorityFeePerGas).to.not.equal(0);
  });
});
