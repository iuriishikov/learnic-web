import { getCardsMock } from '../api/mock-data';

import { YourCards } from './your-cards';

export async function YourCardsBlock() {
  const cards = await getCardsMock();
  return <YourCards cards={cards} />;
}
