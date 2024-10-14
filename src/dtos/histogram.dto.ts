import { z } from 'zod';

export const NumericBucketDtoSchema = z.object({
  ordinal: z.number(),
  count: z.number(),
});

export const CategoryBucketDtoSchema = z.object({
  value: z.string(),
  count: z.number(),
});

const HistogramTypeDtoSchema = z.enum(['numeric', 'category']);

export const HistogramDtoSchema = z.object({
  type: HistogramTypeDtoSchema,
  buckets: NumericBucketDtoSchema.or(CategoryBucketDtoSchema).array(),
  /** The start of the entire range */
  start: z.number().optional(),
  /** The end of the entire range */
  end: z.number().optional(),
});

export type HistogramDto = z.infer<typeof HistogramDtoSchema>;
export type CategoryBucketDto = z.infer<typeof CategoryBucketDtoSchema>;
export type NumericBucketDto = z.infer<typeof NumericBucketDtoSchema>;
