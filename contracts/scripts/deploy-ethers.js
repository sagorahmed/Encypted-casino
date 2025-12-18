// Minimal ethers v6 deploy script for Sepolia (CommonJS)
require('dotenv').config();
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');
const { ethers } = require('ethers');

const RPC = process.env.SEPOLIA_RPC_URL;
const PK = process.env.PRIVATE_KEY;
if (!RPC || !PK) {
  console.error('Missing SEPOLIA_RPC_URL or PRIVATE_KEY in contracts/.env');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PK, provider);

// Load compiled artifact (ABI + bytecode)
const primaryArtifactPath = join(process.cwd(), 'artifacts', 'contracts', 'GameHouse.sol', 'GameHouse.json');
const legacyArtifactPath = join(process.cwd(), 'artifacts', 'GameHouse.sol', 'GameHouse.json');
const artifactPath = existsSync(primaryArtifactPath) ? primaryArtifactPath : legacyArtifactPath;

if (!existsSync(artifactPath)) {
  console.error('Missing compiled artifact. Run `npm run --workspace=contracts compile` first.');
  console.error('Expected one of:');
  console.error('-', primaryArtifactPath);
  console.error('-', legacyArtifactPath);
  process.exit(1);
}

const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
const { abi, bytecode } = artifact;

async function main() {
  console.log('Deploying GameHouse to Sepolia...');
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  const receipt = await contract.deploymentTransaction().wait();
  console.log('✅ Deployed GameHouse at:', contract.target);
  console.log('📋 Tx hash:', receipt.hash);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
