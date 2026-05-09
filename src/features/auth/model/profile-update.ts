import { z } from 'zod';

import {
  DESCRIPTION_MAX,
  FIRST_NAME_MAX,
  LAST_NAME_MAX,
  PATRONYMIC_MAX,
} from './constants';

export const NAME_MIN = 1;

const trimmedString = z.string().trim();

export const firstNameSchema = trimmedString
  .min(NAME_MIN, 'firstNameRequired')
  .max(FIRST_NAME_MAX, 'firstNameTooLong');

export const lastNameSchema = trimmedString
  .min(NAME_MIN, 'lastNameRequired')
  .max(LAST_NAME_MAX, 'lastNameTooLong');

export const patronymicSchema = trimmedString
  .max(PATRONYMIC_MAX, 'patronymicTooLong');

export const descriptionSchema = trimmedString
  .max(DESCRIPTION_MAX, 'descriptionTooLong');

export const profileUpdateSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  patronymic: patronymicSchema,
  description: descriptionSchema,
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
