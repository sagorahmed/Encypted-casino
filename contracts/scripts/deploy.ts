import { ethers } from "hardhat";

async function main() {
  console.log("Deploying GameHouse contract...");
  
  const GameHouse = await ethers.getContractFactory("GameHouse");
  const gameHouse = await GameHouse.deploy();

  await gameHouse.waitForDeployment();

  const address = await gameHouse.getAddress();
  console.log(`GameHouse deployed to: ${address}`);
  console.log("\nContract deployment successful!");
  console.log("\nNext steps:");
  console.log("1. Update frontend/.env.local:");
  console.log(`   NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS=${address}`);
  const [deployer] = await ethers.getSigners();
  console.log(`   NEXT_PUBLIC_OWNER_ADDRESS=${deployer.address}`);
  console.log("2. Start the frontend with: npm run dev --workspace=frontend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
