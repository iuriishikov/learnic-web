export { AppHeader } from './ui/app-header';
export type { AppHeaderProps, AppHeaderNavItem } from './ui/app-header';

export { AppHeaderShell } from './ui/app-header-shell';
export {
  HeaderConfigProvider,
  useHeaderConfig,
  useSetHeaderConfig,
  type HeaderConfigValue,
} from './ui/header-config-provider';
export { HeaderConfig, type HeaderConfigProps } from './ui/header-config';

export { AppSubHeader } from './ui/app-sub-header';
export type { AppSubHeaderProps, AppSubHeaderTab } from './ui/app-sub-header';

export { AppSubHeaderShell } from './ui/app-sub-header-shell';
export {
  SubHeaderConfigProvider,
  useSubHeaderConfig,
  useSetSubHeaderConfig,
  type SubHeaderConfigValue,
} from './ui/sub-header-config-provider';
export {
  SubHeaderConfig,
  type SubHeaderConfigProps,
} from './ui/sub-header-config';

export { AppBreadcrumbs } from './ui/app-breadcrumbs';
export type { AppBreadcrumbsProps } from './ui/app-breadcrumbs';
export { AppBreadcrumbsShell } from './ui/app-breadcrumbs-shell';
export {
  BreadcrumbConfigProvider,
  useBreadcrumbContributions,
  useSetBreadcrumbContribution,
  type BreadcrumbSegment,
  type BreadcrumbContribution,
} from './ui/breadcrumb-config-provider';
export {
  BreadcrumbConfig,
  type BreadcrumbConfigProps,
} from './ui/breadcrumb-config';

export { TeachButton } from './ui/teach-button';

export { UserMenu } from './ui/user-menu';

export { ModeTracker } from './ui/mode-tracker';
export { SettingsHeaderConfig } from './ui/settings-header-config';
export { DefaultHeaderConfig } from './ui/default-header-config';
export {
  APP_MODE_COOKIE,
  DEFAULT_APP_MODE,
  isAppMode,
  type AppMode,
} from './ui/app-mode';
