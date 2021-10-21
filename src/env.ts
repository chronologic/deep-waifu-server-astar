import dotenv from 'dotenv';

dotenv.config();

export const LOG_LEVEL = (process.env.LOG_LEVEL as string) || 'info';

export const PORT = Number(process.env.PORT) || 1337;

export const PROD_BUILD = __filename.endsWith('.js');

export const SELF_URL = process.env.SELF_URL as string;
export const UI_URL = process.env.UI_URL as string;
export const MODEL_URL = process.env.MODEL_URL as string;

export const NETWORK_URL = process.env.NETWORK_URL as string;

export const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS as string;

export const WALLET_PK = process.env.WALLET_PK as string;

export const CREATOR_ADDRESS = process.env.CREATOR_ADDRESS as string;

export const PINATA_API_KEY = process.env.PINATA_API_KEY as string;
export const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY as string;

export const STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLIC_KEY as string;
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;

export const PILLOW_PRICE_USD = Number(process.env.PILLOW_PRICE_USD);

export const IMGBB_KEY = process.env.IMGBB_KEY as string;

export const PRINTFUL_KEY = process.env.PRINTFUL_KEY as string;
