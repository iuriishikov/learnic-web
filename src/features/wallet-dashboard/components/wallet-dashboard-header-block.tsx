import { getAccountsMock, getCardsMock } from '../api/mock-data';

import { WalletDashboardHeader } from './wallet-dashboard-header';

export async function WalletDashboardHeaderBlock() {
  const [accounts, cards] = await Promise.all([
    getAccountsMock(),
    getCardsMock(),
  ]);
  const available = accounts.find((a) => a.kind === 'available');
  return (
    <WalletDashboardHeader
      availableBalance={available?.balance ?? 0}
      cards={cards}
    />
  );
}
