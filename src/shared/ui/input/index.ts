// Public surface of the `input/` package. Mirrors the legacy
// `input-extended.tsx` barrel exactly — `input-extended.tsx` is now a
// one-line re-export of this module, so every existing consumer
// continues to import from `@/shared/ui/input-extended` without change.

// Shell + helpers (low-level)
export {
  InputShell,
  ShellInput,
  LeadingIcon,
  TrailingSlot,
  SideAddon,
  Divider,
  HelpTrigger,
  ErrorIndicator,
} from './shell';

// Type shared by every variant in this package.
export type { CommonInputProps } from './common';

// Variants
export { TextInput } from './text';
export { EmailInput } from './email';
export { DateTimeInput } from './date';
export { WebsiteInput } from './website';
// Keep the historical `HttpsInput` alias — old consumers still reach for it.
export { HttpsUrlInput as HttpsInput } from './url';
export { PasswordInput } from './password';
export { NumberStepperInput, NumberSpinnerInput } from './number';
export { CodeInput } from './code';
export { FileInput } from './file';
export { PhoneInput } from './phone';
export { MoneyInput } from './money';
export { CardNumberInput } from './card';
export { TagsInput } from './tags';

// Row wrapper
export { FieldRow } from './field-row';
