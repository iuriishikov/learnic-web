// Public API for the billing feature. Consumers import from
// `@/features/billing` only — never reach into subfolders.

export { SubscriptionCard } from './components/subscription-card';
export type { SubscriptionCardProps } from './components/subscription-card';

export { useMySubscription, mySubscriptionKey } from './api/use-my-subscription';
export { getMySubscriptionAction } from './api/get-my-subscription';
export type { GetMySubscriptionResult } from './api/get-my-subscription';

export type {
  MySubscription,
  PlanInfo,
  PlanLimits,
  StorageUsage,
} from './model/subscription';
