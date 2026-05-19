import { getAccountsMock } from '../api/mock-data';

import { AccountSummaryCard } from './account-summary-card';

export async function AccountsBlock() {
  const accounts = await getAccountsMock();
  const total = accounts.reduce((sum, a) => sum + a.balance, 0) || 1;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
      {accounts.map((account) => (
        <AccountSummaryCard
          key={account.id}
          account={account}
          fillRatio={account.balance / total}
        />
      ))}
    </div>
  );
}
