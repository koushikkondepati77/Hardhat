const { expect } = require("chai");

describe("PriorityFeeManager", function () {
  let PriorityFeeManager;
  let priorityFeeManager;

  beforeEach(async () => {
    PriorityFeeManager = await ethers.getContractFactory("PriorityFeeManager");
    priorityFeeManager = await PriorityFeeManager.deploy(1);
  });

  it("should allow setting and getting maxPriorityFeePerGas", async function () {
    const newMaxPriorityFeePerGas = 100; // New value

    await priorityFeeManager.setMaxPriorityFeePerGas(newMaxPriorityFeePerGas);
    const updatedMaxPriorityFeePerGas = await priorityFeeManager.maxPriorityFeePerGas(); // Call the function

    expect(updatedMaxPriorityFeePerGas).to.equal(newMaxPriorityFeePerGas);
    console.log("updatedMaxPriorityFeePerGas", updatedMaxPriorityFeePerGas);
    console.log("newMaxPriorityFeePerGas", newMaxPriorityFeePerGas)

  });
});
