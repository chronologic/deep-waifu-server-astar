import { UploadedFile } from 'express-fileupload';
import queue from 'queue';

import { MINUTE_MILLIS } from '../../constants';
import { createLogger } from '../../logger';
import { createOpenseaManifest, createTimedCache } from '../../utils';
import { provider, deepWaifuContract } from '../../astar';
import { BadRequestError, NotFoundError } from '../errors';
import { pinFile, pinJson } from './pinata';

interface IMintParams {
  tx: string;
  waifu: UploadedFile;
  certificate: UploadedFile;
  name: string;
}

interface IMintPaymentTx {
  payer: string;
  id: number;
}

interface IMintResult {
  status: string;
  message: string;
  id?: number;
  tx?: string;
  metadataLink?: string;
  certificateLink?: string;
}

const cache = createTimedCache<string, IMintResult>(60 * MINUTE_MILLIS);
const logger = createLogger('mint');

const MAX_FILE_SIZE_KB = 1024;
const MAX_NAME_LENGTH = 24;

const q = queue({
  concurrency: 10,
  autostart: true,
});

export async function pushMintToQueue(params: IMintParams): Promise<void> {
  validateName(params.name);
  validateFileSize(params.waifu);
  validateFileSize(params.certificate);

  logger.info(`[${params.tx}] 🗄 adding to queue...`);
  cache.put(params.tx, { status: 'queued', message: `place in line: ${q.length}` });
  q.push(async () => mint(params));
}

async function mint({ tx, waifu, certificate, name }: IMintParams) {
  try {
    logger.info(`[${tx}] 🧮 processing...`);
    cache.put(tx, { status: 'processing', message: 'Processing...' });

    logger.info(`[${tx}] 📊 validating tx...`);
    const decodedTx = await decodeAndValidateTx(tx);

    // logger.info(`[${tx}] 🗂 verifying id...`);
    // await verifyIdNotUsed(decodedTx.id);

    logger.info(`[${tx}] 🚀 minting to ${decodedTx.payer}...`);
    const mintedRes = await mintNft({ tx, waifu, certificate, name }, decodedTx);
    cache.put(tx, {
      status: 'minted',
      message: 'Success!',
      id: decodedTx.id,
      tx: mintedRes.tx,
      metadataLink: mintedRes.metadataLink,
      certificateLink: mintedRes.certificateLink,
    });

    logger.info(`[${tx}] 👌 all done!`);
  } catch (e) {
    logger.error(`[${tx}] ❌ ERROR`);
    logger.error(e);
    cache.put(tx, { status: 'error', message: e.message });
  }
}

function validateName(name: string) {
  if (name.length > MAX_NAME_LENGTH) {
    throw new BadRequestError(`Name can be at most ${MAX_NAME_LENGTH} chars long`);
  }
}

function validateFileSize(selfie: UploadedFile) {
  if (selfie.size > MAX_FILE_SIZE_KB * 1024) {
    throw new BadRequestError(`Max allowed file size is ${MAX_FILE_SIZE_KB}kB`);
  }
}

async function decodeAndValidateTx(tx: string): Promise<IMintPaymentTx> {
  const txReceipt = await provider.getTransactionReceipt(tx);

  if (txReceipt.status !== 1) {
    throw new BadRequestError('Invalid payment tx: tx failed');
  }

  if (txReceipt.to.toLowerCase() !== deepWaifuContract.address.toLowerCase()) {
    throw new BadRequestError('Invalid payment tx: invalid target');
  }

  if (txReceipt.logs.length !== 1) {
    throw new BadRequestError('Invalid payment tx: unexpected logs length');
  }

  const log = txReceipt.logs[0];

  const { name, args } = deepWaifuContract.interface.parseLog(log);
  if (name !== 'PaidForMint') {
    throw new BadRequestError('Invalid payment tx: unexpected log name');
  }

  const [payer, amount, id] = args;

  return { payer, id };
}

async function mintNft(
  { waifu, certificate, name }: IMintParams,
  { id, payer }: IMintPaymentTx
): Promise<{ tx: string; metadataLink: string; certificateLink: string }> {
  logger.info('Uploading images and metadata...');
  // eslint-disable-next-line prefer-template
  const waifuLink = await pinFile(waifu.data, 'waifu.png', name + ' image');
  // eslint-disable-next-line prefer-template
  const certificateLink = await pinFile(certificate.data, 'certificate.png', name + ' certificate');

  const manifest = createOpenseaManifest({
    name,
    id,
    imageUrl: waifuLink,
    certificateUrl: certificateLink,
  });

  // eslint-disable-next-line prefer-template
  const metadataLink = await pinJson(manifest, name + ' metadata');

  logger.info('Minting...');

  const res = await deepWaifuContract.mintNFT(payer, id, metadataLink);

  return { tx: res.hash, metadataLink, certificateLink };
}

export function getStatus(paymentTx: string) {
  const res = cache.get(paymentTx);

  if (res) {
    return res;
  }

  throw new NotFoundError('Job not found');
}
