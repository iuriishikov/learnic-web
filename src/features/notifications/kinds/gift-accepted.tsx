import type { ActorRef, GiftSnapshot, ProductRef } from '../model/types';

import {
  type ActorRaw,
  type GiftRaw,
  type ProductRaw,
  toActor,
  toGift,
  toProduct,
} from './shared';
import type { KindDescriptor } from './types';

export type GiftAcceptedRaw = {
  type: 'gift_accepted';
  gift_id: string;
  product: ProductRaw;
  recipient: ActorRaw | null;
  gift: GiftRaw | null;
};

export type GiftAcceptedDetails = {
  type: 'gift_accepted';
  giftId: string;
  product: ProductRef;
  recipient: ActorRef | null;
  gift: GiftSnapshot | null;
};

export const giftAcceptedDescriptor: KindDescriptor<
  GiftAcceptedRaw,
  GiftAcceptedDetails
> = {
  leadKey: 'giftAccepted',
  parseRaw: (raw) => ({
    type: 'gift_accepted',
    giftId: raw.gift_id,
    product: toProduct(raw.product),
    recipient: raw.recipient ? toActor(raw.recipient) : null,
    gift: toGift(raw.gift),
  }),
  // Display-only: the gifter is informed the recipient accepted; the
  // embedded recipient is the fallback actor for the avatar/line.
  getFallbackActor: (details) => details.recipient,
};
