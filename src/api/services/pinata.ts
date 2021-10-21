import pinataSDK from '@pinata/sdk';
import { Duplex, Readable } from 'stream';

import { PINATA_API_KEY, PINATA_SECRET_KEY } from '../../env';

const baseUrl = 'https://gateway.pinata.cloud/ipfs/';

const pinata = pinataSDK(PINATA_API_KEY, PINATA_SECRET_KEY);

export async function pinJson(json: any, name: string): Promise<string> {
  const res = await pinata.pinJSONToIPFS(json, {
    pinataMetadata: { name },
  });

  return baseUrl + res.IpfsHash;
}

export async function pinFile(file: Buffer, filename: string, name: string): Promise<string> {
  const readable = bufferToStream(file);
  // https://github.com/PinataCloud/Pinata-SDK/issues/28
  (readable as any).path = filename;

  const res = await pinata.pinFileToIPFS(readable, {
    pinataMetadata: { name },
  });

  return baseUrl + res.IpfsHash;
}

function bufferToStream(buf: Buffer): Readable {
  const dup = new Duplex();
  dup.push(buf);
  dup.push(null);

  return dup;
}
