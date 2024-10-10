import {
  CategoryBucket,
  Histogram,
  NumericBucket,
} from '../entities/histogram.entity';

export class HistogramDto {
  buckets: (NumericBucketDto | CategoryBucketDto)[];
  /** The start of the entire range */
  start?: number;
  /** The end of the entire range */
  end?: number;

  static fromDb(histogram: Histogram): HistogramDto {
    return {
      buckets: histogram.buckets,
      start: histogram.start,
      end: histogram.end,
    };
  }
}

export class NumericBucketDto {
  ordinal: number;
  count: number;

  static fromDb(bucket: NumericBucket): NumericBucketDto {
    return {
      ordinal: bucket.ordinal,
      count: bucket.count,
    };
  }
}

export class CategoryBucketDto {
  value: string;
  count: number;

  static fromDb(bucket: CategoryBucket): CategoryBucketDto {
    return {
      value: bucket.value,
      count: bucket.count,
    };
  }
}
