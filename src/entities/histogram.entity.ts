export class Histogram {
  buckets: (NumericBucket | CategoryBucket)[];
  /** The start of the entire range, if applicable */
  start?: number;
  /** The end of the entire range, if applicable */
  end?: number;

  constructor(data: Histogram) {
    Object.assign(this, data);
  }
}

export class NumericBucket {
  ordinal: number;
  count: number;

  constructor(data: NumericBucket) {
    Object.assign(this, data);
  }
}

export class CategoryBucket {
  value: string;
  count: number;
}
