import { z } from 'zod';

/**
 * Field length limits mirror
 * `learnic/src/learnic/entities/user_experience/constants.py`.
 * Keeping them here lets the form reject bad input before the
 * round-trip; the backend re-validates via the VO regardless.
 */
export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 1_000;
export const SOURCE_URL_MAX = 2_048;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const experienceFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'titleRequired')
      .max(TITLE_MAX, 'titleTooLong'),
    description: z.string().max(DESCRIPTION_MAX, 'descriptionTooLong'),
    startDate: z
      .string()
      .regex(ISO_DATE, 'startDateInvalid')
      .min(1, 'startDateRequired'),
    endDate: z.string().regex(ISO_DATE, 'endDateInvalid').or(z.literal('')),
    ongoing: z.boolean(),
    sourceUrl: z.string().max(SOURCE_URL_MAX, 'sourceUrlTooLong'),
  })
  .superRefine((value, ctx) => {
    if (!value.ongoing) {
      if (!value.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'endDateRequired',
        });
        return;
      }
      if (value.endDate < value.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'endDateBeforeStart',
        });
      }
    }
    const url = value.sourceUrl?.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceUrl'],
        message: 'sourceUrlScheme',
      });
    }
  });

export type ExperienceFormInput = z.infer<typeof experienceFormSchema>;
