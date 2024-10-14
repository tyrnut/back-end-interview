import { z } from 'zod';

export const NumericBucketSchema = z.object({
  ordinal: z.number(),
  count: z.number(),
});

export const CategoryBucketSchema = z.object({
  value: z.string(),
  count: z.number(),
});

export const HistogramSchema = z.object({
  buckets: CategoryBucketSchema.or(NumericBucketSchema).array(),
  /** The start of the entire range */
  start: z.number().optional(),
  /** The end of the entire range */
  end: z.number().optional(),
});

export type Histogram = z.infer<typeof HistogramSchema>;
export type CategoryBucket = z.infer<typeof CategoryBucketSchema>;
export type NumericBucket = z.infer<typeof NumericBucketSchema>;
