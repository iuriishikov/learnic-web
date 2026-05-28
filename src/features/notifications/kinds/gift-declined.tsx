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

export type GiftDeclinedRaw = {
  type: 'gift_declined';
  gift_id: string;
  product: ProductRaw;
  decliner: ActorRaw | null;
  gift: GiftRaw | null;
};

export type GiftDeclinedDetails = {
  type: 'gift_declined';
  giftId: string;
  product: ProductRef;
  decliner: ActorRef | null;
  gift: GiftSnapshot | null;
};

export const giftDeclinedDescriptor: KindDescriptor<
  GiftDeclinedRaw,
  GiftDeclinedDetails
> = {
  leadKey: 'giftDeclined',
  parseRaw: (raw) => ({
    type: 'gift_declined',
    giftId: raw.gift_id,
    product: toProduct(raw.product),
    decliner: raw.decliner ? toActor(raw.decliner) : null,
    gift: toGift(raw.gift),
  }),
  // Display-only: the gifter is informed the recipient declined; the
  // embedded decliner is the fallback actor for the avatar/line.
  getFallbackActor: (details) => details.decliner,
};
