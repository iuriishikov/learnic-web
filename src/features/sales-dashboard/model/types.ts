export type KpiId = 'students' | 'profileViews' | 'productViews';

export type Kpi = {
  id: KpiId;
  value: number;
  trendPercent: number;
  format: 'currency' | 'integer';
  spark: number[];
};

export type SalesPoint = {
  day: number;
  current: number;
  previous: number;
};

export type OrderStatus = 'paid' | 'refunded';

export type OrderCustomer = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  initials: string;
};

export type Order = {
  id: string;
  number: string;
  date: string;
  status: OrderStatus;
  amount: number;
  rating: number;
  customer: OrderCustomer;
};

export type SalesPeriod = 'custom' | '12m' | '30d' | '7d' | '24h';

export type ChartPeriod = '12m' | '30d' | '7d' | '24h';

export type OrdersFilter = 'all' | OrderStatus;

export type ActivityEntry = {
  id: string;
  customer: OrderCustomer & { online?: boolean };
  productTitle: string;
};
