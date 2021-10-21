import { IManifest } from '../types';

export function createOpenseaManifest({
  name,
  id,
  imageUrl,
  certificateUrl,
}: {
  name: string;
  id: number;
  imageUrl: string;
  certificateUrl: string;
}): IManifest {
  return {
    name: `${name} (#${id})`,
    image: imageUrl,
    description: `Deep Waifu #${id}`,
    certificate: certificateUrl,
    attributes: [],
  };
}
