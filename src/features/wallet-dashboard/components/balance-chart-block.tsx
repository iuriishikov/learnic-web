import { getBalanceSeriesMock } from '../api/mock-data';

import { BalanceChart } from './balance-chart';

export async function BalanceChartBlock() {
  const data = await getBalanceSeriesMock();
  return <BalanceChart data={data} />;
}
