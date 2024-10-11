import { Repository } from 'typeorm';
import { snakeCase } from 'lodash';
import {
  CommodityProjection,
  tableName,
} from '../entities/commodity-projection.entity';
import {
  CategoryBucket,
  Histogram,
  HistogramSchema,
} from '../entities/histogram.entity';

export type CommodityProjectionProperty = keyof Omit<CommodityProjection, 'id'>;

export type CommodityProjectionRepo = Repository<CommodityProjection> &
  CommodityProjectionRepoExtension;

/** The repository extension for CommodityProjection */
export type CommodityProjectionRepoExtension = {
  /**
   * Only numeric properties can be used to create
   * numeric histograms. Everything else is
   * categorical.
   */
  isNumericProperty(prop: CommodityProjectionProperty): boolean;

  /**
   * @returns Histogram with zero or more {CategoryBucket[]}
   */
  getCategoryHistogramBuckets(
    prop: CommodityProjectionProperty,
  ): Promise<Histogram>;

  /**
   *
   * Note about Numeric histograms:
   *   If the table is empty, there will be no buckets.
   *   If a bucket is empty, that bucket will not be in the response
   *   There will almost always be an extra bucket with ordinal (bucketCount + 1)
   *     for values that are exactly at the maximum
   *
   * @param bucketCount Number of buckets for the histogram
   * @returns A Histogram with 0 or more buckets, up to bucketCount + 1
   */
  getNumericHistogram(
    prop: CommodityProjectionProperty,
    bucketCount: number,
  ): Promise<Histogram>;
};

export const repoExtension: CommodityProjectionRepoExtension = {
  isNumericProperty(prop: CommodityProjectionProperty): boolean {
    return prop === 'value';
  },

  async getCategoryHistogramBuckets(
    prop: CommodityProjectionProperty,
  ): Promise<Histogram> {
    const column = snakeCase(prop);
    const sql = `SELECT ${column} AS value, COUNT(*)::int AS count FROM ${tableName} GROUP BY ${column} ORDER BY count`;
    const repo = this as Repository<CommodityProjection>;
    return repo.manager
      .query<CategoryBucket[]>(sql)
      .then((buckets) => HistogramSchema.parse({ buckets: buckets }));
  },

  async getNumericHistogram(
    prop: CommodityProjectionProperty,
    bucketCount: number,
  ): Promise<Histogram> {
    const column = snakeCase(prop);

    const sql = `
      WITH range AS (
        SELECT 
          MIN(${column}) AS min_val, 
          MAX(${column}) AS max_val 
        FROM 
          ${tableName}
      ), width_buckets AS (
        SELECT 
          WIDTH_BUCKET(
            ${column},
            (SELECT min_val FROM range), 
            (SELECT max_val FROM range),
            ${bucketCount}
          ) AS ordinal, 
          COUNT(*) AS count
        FROM 
          ${tableName}
        WHERE
          ${column} IS NOT NULL
        GROUP BY 
          ordinal
        ORDER BY
          ordinal
      )
      SELECT 
        JSON_AGG(JSON_BUILD_OBJECT('ordinal', width_buckets.ordinal, 'count', width_buckets.count)) AS buckets,
        MIN(range.min_val) AS start, 
        MIN(range.max_val) AS end
      FROM 
        width_buckets, 
        range
    `;
    const repo = this as Repository<CommodityProjection>;
    return repo.manager.query<Record<string, any>[]>(sql).then((histograms) => {
      return histograms.length
        ? HistogramSchema.parse(histograms[0])
        : { buckets: [] };
    });
  },
};
