import { getSalesKpisMock } from '../api/mock-data';

import { KpiCard } from './kpi-card';

export async function KpiCardsBlock() {
  const kpis = await getSalesKpisMock();
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
