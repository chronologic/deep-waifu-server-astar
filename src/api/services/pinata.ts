import pinataSDK from '@pinata/sdk';

import { PINATA_API_KEY, PINATA_SECRET_KEY } from '../../env';

const pinata = pinataSDK(PINATA_API_KEY, PINATA_SECRET_KEY);

pinata.testAuthentication().then(console.log);
