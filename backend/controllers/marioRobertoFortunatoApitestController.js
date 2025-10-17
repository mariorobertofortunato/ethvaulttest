const { ethers } = require('ethers');
const asyncErrorHandler = require("../middlewares/helpers/asyncErrorHandler");
const ErrorHandler = require("../utils/errorHandler");

const dETHABI = require('../../lib/abis/dETH.json');
const sETHABI = require('../../lib/abis/sETH.json');
const governanceABI = require('../../lib/abis/governance.json');
const stakingDashboardABI = require('../../lib/abis/stakingDashboard.json');

exports.getProjectContractInfo = asyncErrorHandler(async (req, res, next) => {
  try {
    const { contractType, contractAddress, network = 'mainnet' } = req.body;
    
    if (!contractType || !contractAddress) {
      return next(new ErrorHandler("Contract type and address are required", 400));
    }

    console.log('=== MarioRobertoFortunatoApitest - Project Contract Information ===');
    console.log('Contract Type:', contractType);
    console.log('Contract Address:', contractAddress);
    console.log('Network:', network);
    
    const rpcUrls = {
      mainnet: 'https://eth.llamarpc.com',
      sepolia: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      goerli: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      localhost: 'http://localhost:8545'
    };

    const rpcUrl = rpcUrls[network] || rpcUrls.localhost;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const contractInfo = {
      contractType: contractType,
      address: contractAddress,
      network: network,
      timestamp: new Date().toISOString(),
      provider: rpcUrl
    };

    try {

      const code = await provider.getCode(contractAddress);
      contractInfo.hasCode = code !== '0x';
      contractInfo.codeLength = code.length;
      
      const balance = await provider.getBalance(contractAddress);
      contractInfo.balance = ethers.formatEther(balance);
      
      const nonce = await provider.getTransactionCount(contractAddress);
      contractInfo.transactionCount = nonce;
      
      const blockNumber = await provider.getBlockNumber();
      contractInfo.currentBlockNumber = blockNumber;

      let contract;
      let contractData = {};

      switch (contractType.toLowerCase()) {
        case 'deth':
          contract = new ethers.Contract(contractAddress, dETHABI, provider);
          try {
            contractData.name = await contract.name();
            contractData.symbol = await contract.symbol();
            contractData.decimals = (await contract.decimals()).toString();
            contractData.totalSupply = (await contract.totalSupply()).toString();
            contractData.owner = await contract.owner();
            contractData.ethBalance = (await contract.getContractETHBalance()).toString();
            
            console.log('dETH Contract Data:');
            console.log('  Name:', contractData.name);
            console.log('  Symbol:', contractData.symbol);
            console.log('  Total Supply:', ethers.formatEther(contractData.totalSupply));
            console.log('  Owner:', contractData.owner);
            console.log('  ETH Balance:', ethers.formatEther(contractData.ethBalance));
          } catch (e) {
            console.log('Error fetching dETH data:', e.message);
            contractData.error = e.message;
          }
          break;

        case 'seth':
          contract = new ethers.Contract(contractAddress, sETHABI, provider);
          try {
            contractData.name = await contract.name();
            contractData.symbol = await contract.symbol();
            contractData.decimals = (await contract.decimals()).toString();
            contractData.totalSupply = (await contract.totalSupply()).toString();
            contractData.owner = await contract.owner();
            
            const stakingStats = await contract.getStakingStats();
            contractData.totalStaked = stakingStats[0].toString();
            contractData.totalStakers = stakingStats[1].toString();
            contractData.averageStake = stakingStats[2].toString();
            
            console.log('sETH Contract Data:');
            console.log('  Name:', contractData.name);
            console.log('  Symbol:', contractData.symbol);
            console.log('  Total Supply:', ethers.formatEther(contractData.totalSupply));
            console.log('  Owner:', contractData.owner);
            console.log('  Total Staked:', ethers.formatEther(contractData.totalStaked));
            console.log('  Total Stakers:', contractData.totalStakers.toString());
            console.log('  Average Stake:', ethers.formatEther(contractData.averageStake));
          } catch (e) {
            console.log('Error fetching sETH data:', e.message);
            contractData.error = e.message;
          }
          break;

        case 'governance':
          contract = new ethers.Contract(contractAddress, governanceABI, provider);
          try {
            contractData.proposalCount = (await contract.proposalCount()).toString();
            contractData.votingPeriod = (await contract.votingPeriod()).toString();
            contractData.executionDelay = (await contract.executionDelay()).toString();
            contractData.quorum = (await contract.quorum()).toString();
            contractData.owner = await contract.owner();
            
            console.log('Governance Contract Data:');
            console.log('  Proposal Count:', contractData.proposalCount.toString());
            console.log('  Voting Period:', contractData.votingPeriod.toString(), 'seconds');
            console.log('  Execution Delay:', contractData.executionDelay.toString(), 'seconds');
            console.log('  Quorum:', ethers.formatEther(contractData.quorum));
            console.log('  Owner:', contractData.owner);
          } catch (e) {
            console.log('Error fetching Governance data:', e.message);
            contractData.error = e.message;
          }
          break;

        case 'stakingdashboard':
          contract = new ethers.Contract(contractAddress, stakingDashboardABI, provider);
          try {
            const overview = await contract.getStakingOverview();
            contractData.totalETHDeposited = overview[0].toString();
            contractData.totalETHStaked = overview[1].toString();
            contractData.totalStakers = overview[2].toString();
            contractData.averageStakeAmount = overview[3].toString();
            
            console.log('StakingDashboard Contract Data:');
            console.log('  Total ETH Deposited:', ethers.formatEther(contractData.totalETHDeposited));
            console.log('  Total ETH Staked:', ethers.formatEther(contractData.totalETHStaked));
            console.log('  Total Stakers:', contractData.totalStakers.toString());
            console.log('  Average Stake Amount:', ethers.formatEther(contractData.averageStakeAmount));
          } catch (e) {
            console.log('Error fetching StakingDashboard data:', e.message);
            contractData.error = e.message;
          }
          break;

        default:
          contractData.error = 'Unknown contract type. Supported types: dETH, sETH, Governance, StakingDashboard';
      }

      contractInfo.contractData = contractData;

    } catch (error) {
      console.log('Error fetching contract details:', error.message);
      contractInfo.error = error.message;
    }

    console.log('Basic Contract Info:');
    console.log('  Has Code:', contractInfo.hasCode);
    console.log('  Balance (ETH):', contractInfo.balance);
    console.log('  Transaction Count:', contractInfo.transactionCount);
    console.log('  Current Block:', contractInfo.currentBlockNumber);
    console.log('Timestamp:', contractInfo.timestamp);
    console.log('===============================================================');

    res.status(200).json({
      success: true,
      message: "Project contract information retrieved successfully",
      data: contractInfo
    });

  } catch (error) {
    console.error('MarioRobertoFortunatoApitest Error:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});