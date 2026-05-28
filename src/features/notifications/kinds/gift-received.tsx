import type { GiftSnapshot, ProductRef } from '../model/types';

import { NotificationGiftActions } from '../components/notification-gift-actions';

import {
  type GiftRaw,
  type ProductRaw,
  toGift,
  toProduct,
} from './shared';
import type { KindDescriptor } from './types';

export type GiftReceivedRaw = {
  type: 'gift_received';
  gift_id: string;
  product: ProductRaw;
  gift: GiftRaw | null;
};

export type GiftReceivedDetails = {
  type: 'gift_received';
  giftId: string;
  product: ProductRef;
  gift: GiftSnapshot | null;
};

export const giftReceivedDescriptor: KindDescriptor<
  GiftReceivedRaw,
  GiftReceivedDetails
> = {
  leadKey: 'giftReceived',
  parseRaw: (raw) => ({
    type: 'gift_received',
    giftId: raw.gift_id,
    product: toProduct(raw.product),
    gift: toGift(raw.gift),
  }),
  Action: ({ details, onResolved }) => (
    <NotificationGiftActions
      giftId={details.giftId}
      gift={details.gift}
      onResolved={onResolved}
    />
  ),
};
