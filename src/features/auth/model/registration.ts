import { z } from 'zod';

import {
  EMAIL_MAX,
  FIRST_NAME_MAX,
  LAST_NAME_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  PATRONYMIC_MAX,
} from './constants';

export const NAME_MIN = 1;

export const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(NAME_MIN, 'firstNameRequired')
    .max(FIRST_NAME_MAX, 'firstNameTooLong'),
  lastName: z
    .string()
    .trim()
    .min(NAME_MIN, 'lastNameRequired')
    .max(LAST_NAME_MAX, 'lastNameTooLong'),
  patronymic: z
    .string()
    .trim()
    .max(PATRONYMIC_MAX, 'patronymicTooLong'),
  password: z
    .string()
    .min(PASSWORD_MIN, 'passwordTooShort')
    .max(PASSWORD_MAX, 'passwordTooLong'),
  email: z
    .string()
    .trim()
    .min(1, 'emailRequired')
    .max(EMAIL_MAX, 'emailTooLong')
    .email('emailInvalid'),
  acceptConsent: z.boolean().refine((value) => value, 'consentRequired'),
  // Optional consent to distribution of personal data (ст. 10.1 152-ФЗ).
  // Declining must not block registration, so no refinement here.
  acceptDistribution: z.boolean(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
