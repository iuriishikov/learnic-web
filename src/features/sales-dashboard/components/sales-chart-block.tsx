import { getSalesSeriesMock } from '../api/mock-data';

import { SalesChart } from './sales-chart';

export async function SalesChartBlock() {
  const { total, trendPercent, points } = await getSalesSeriesMock();
  return (
    <SalesChart total={total} trendPercent={trendPercent} points={points} />
  );
}
