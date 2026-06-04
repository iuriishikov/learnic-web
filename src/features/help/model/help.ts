import { z } from 'zod';

const NAME_MAX = 100;
const EMAIL_MAX = 254;
const MESSAGE_MAX = 2000;

export const helpSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'firstNameRequired')
    .max(NAME_MAX, 'firstNameTooLong'),
  lastName: z
    .string()
    .trim()
    .min(1, 'lastNameRequired')
    .max(NAME_MAX, 'lastNameTooLong'),
  email: z
    .string()
    .trim()
    .min(1, 'emailRequired')
    .max(EMAIL_MAX, 'emailTooLong')
    .email('emailInvalid'),
  // Russian number, optional. When provided it must be complete — all 10
  // national digits (the `+7` prefix is fixed in the UI, not part of value).
  phone: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || v.replace(/\D/g, '').length === 10,
      'phoneIncomplete',
    ),
  message: z
    .string()
    .trim()
    .min(1, 'messageRequired')
    .max(MESSAGE_MAX, 'messageTooLong'),
  // Privacy-policy consent must be explicitly granted before sending.
  consent: z.boolean().refine((v) => v === true, { message: 'consentRequired' }),
});

export type HelpInput = z.infer<typeof helpSchema>;
