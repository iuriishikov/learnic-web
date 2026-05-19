import { getActivityFeedMock } from '../api/mock-data';

import { ActivityFeed } from './activity-feed';

export async function ActivityFeedBlock() {
  const entries = await getActivityFeedMock();
  return <ActivityFeed entries={entries} />;
}
