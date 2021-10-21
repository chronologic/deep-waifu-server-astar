import { ethers } from 'ethers';

import { NETWORK_URL, NFT_CONTRACT_ADDRESS, WALLET_PK } from './env';
import deepWaifuAbi from './abi/DeepWaifu.json';
import { DeepWaifu } from './abi/typechain';

export const wallet = new ethers.Wallet(WALLET_PK);

wallet.getAddress().then((address) => console.log(`Using wallet ${address}`));

export const provider = new ethers.providers.JsonRpcProvider(NETWORK_URL);

wallet.connect(provider);

export const deepWaifuContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, deepWaifuAbi.abi, provider) as DeepWaifu;
