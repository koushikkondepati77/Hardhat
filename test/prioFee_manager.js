const { expect } = require("chai");

describe("PriorityFeeManager", function () {
  let PriorityFeeManager;
  let priorityFeeManager;

  beforeEach(async () => {
    PriorityFeeManager = await ethers.getContractFactory("PriorityFeeManager");
    priorityFeeManager = await PriorityFeeManager.deploy(1);
    await priorityFeeManager.deployed();
  });

  it("should allow setting and getting maxPriorityFeePerGas", async function () {
    const newMaxPriorityFeePerGas = 5; // New value

    await priorityFeeManager.setMaxPriorityFeePerGas(newMaxPriorityFeePerGas);
    const updatedMaxPriorityFeePerGas = await priorityFeeManager.maxPriorityFeePerGas;

    expect(updatedMaxPriorityFeePerGas).to.equal(newMaxPriorityFeePerGas);
  });
});
