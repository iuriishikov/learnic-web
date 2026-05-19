import { getOrdersMock } from '../api/mock-data';

import { OrdersTable } from './orders-table';

export async function OrdersBlock() {
  const orders = await getOrdersMock();
  return <OrdersTable orders={orders} />;
}
