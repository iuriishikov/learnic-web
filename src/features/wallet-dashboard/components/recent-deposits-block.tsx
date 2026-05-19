import { getRecentTransactionsMock } from '../api/mock-data';

import { RecentDeposits } from './recent-deposits';

export async function RecentDepositsBlock() {
  const transactions = await getRecentTransactionsMock();
  return <RecentDeposits deposits={transactions} />;
}
