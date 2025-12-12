import { ethers } from "hardhat";

async function main() {
  console.log("🎰 Starting Sepolia deployment...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying contracts with account: ${deployer.address}`);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === BigInt(0)) {
    console.error("❌ ERROR: Account has no ETH. Please fund your wallet with Sepolia ETH.");
    console.error("Get free Sepolia ETH from: https://www.sepoliafaucet.com");
    process.exit(1);
  }

  // Deploy GameHouse contract
  console.log("🚀 Deploying GameHouse contract to Sepolia...");
  const GameHouse = await ethers.getContractFactory("GameHouse");
  const gameHouse = await GameHouse.deploy();
  
  const deploymentTx = gameHouse.deploymentTransaction();
  if (deploymentTx) {
    console.log(`⏳ Transaction hash: ${deploymentTx.hash}`);
  }

  await gameHouse.waitForDeployment();

  const gameHouseAddress = await gameHouse.getAddress();
  console.log(`✅ GameHouse deployed to: ${gameHouseAddress}\n`);

  // Wait for confirmation
  console.log("⏳ Waiting for block confirmations...");
  const receipt = await gameHouse.deploymentTransaction()?.wait(5);
  if (receipt) {
    console.log(`✅ Confirmed in ${receipt.blockNumber} block\n`);
  }

  // Log deployment info
  console.log("=" .repeat(70));
  console.log("🎉 SEPOLIA DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(70));
  console.log(`
  Network: Sepolia (ChainID: 11155111)
  Contract Address: ${gameHouseAddress}
  Deployer Address: ${deployer.address}
  
  📝 Add this to your .env.sepolia file:
  NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS=${gameHouseAddress}
  NEXT_PUBLIC_OWNER_ADDRESS=${deployer.address}
  
  🔗 View on Etherscan:
  https://sepolia.etherscan.io/address/${gameHouseAddress}
  
  🌐 Frontend Connection Settings:
  - Network: Sepolia Testnet
  - Chain ID: 11155111
  - RPC URL: https://sepolia.infura.io/v3/YOUR_INFURA_KEY
  `);
  console.log("=" .repeat(70));

  // Test contract
  console.log("\n🧪 Testing contract...");
  try {
    const owner = await gameHouse.owner();
    console.log(`✅ Owner verified: ${owner}`);
    console.log("✅ Contract is ready for testing!");
  } catch (error) {
    console.error("❌ Contract test failed:", error);
  }
}

main().catch((error) => {
  console.error("❌ Deployment error:", error);
  process.exitCode = 1;
});
