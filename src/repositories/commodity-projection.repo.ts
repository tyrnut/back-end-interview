import { Repository } from 'typeorm';
import { snakeCase } from 'lodash';
import {
  CommodityProjection,
  tableName,
} from '../entities/commodity-projection.entity';
import { CategoryBucket, Histogram } from '../entities/histogram.entity';

export type CommodityProjectionRepoExtension = {
  isNumericProperty(name: string): boolean;
  getCategoricalHistogramBuckets(
    property: CommodityProjectionProperty,
  ): Promise<Histogram>;
  /* Notes about Numeric histograms
   * These will have between 0 and bucketCount + 1 buckets.
   *   The 'extra' bucket has values that were exactly at
   *   the top of the data's range. It is customary to combine it
   *   with the expected final bucket, but there are other
   *   approaches, and that choice will be left to the client.
   * There may also be buckets missing if there was no data for the range.
   *   Again this is left up to the client as it may or may not be
   *   necessary to have that information, and if it is, it can easily be
   *   filled in with empty buckets.
   */
  getNumericHistogram(
    property: CommodityProjectionProperty,
    bucketCount?: number,
  ): Promise<Histogram>;
};

export type CommodityProjectionProperty = keyof Omit<CommodityProjection, 'id'>;

export const repoExtension: CommodityProjectionRepoExtension = {
  isNumericProperty(name: string): boolean {
    return name === 'value';
  },

  /**
   * @returns Histogram with zero or more {CategoryBucket[]}
   */
  async getCategoricalHistogramBuckets(
    property: CommodityProjectionProperty,
  ): Promise<Histogram> {
    const column = snakeCase(property);
    const sql = `SELECT ${column} AS value, COUNT(*) AS count FROM ${tableName} GROUP BY ${column} ORDER BY count`;
    const repo = this as Repository<CommodityProjection>;
    return repo.manager
      .query<CategoryBucket[]>(sql)
      .then((buckets) => new Histogram({ buckets: buckets }));
  },

  /**
   * @param bucketCount Number of buckets to use. The response will omit empty buckets, and an extra
   *   bucket after the final one may exist if there are any that fall exactly on the maximum value
   *   for the property
   * @returns A Histogram with 0 or more buckets, up to bucketCount + 1
   */
  async getNumericHistogram(
    property: CommodityProjectionProperty,
    bucketCount = 10,
  ): Promise<Histogram> {
    const column = snakeCase(property);

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
    return repo.manager.query<Histogram[]>(sql).then((histograms) => {
      if (histograms.length == 0) {
        return new Histogram({ buckets: [] });
      } else {
        return histograms[0];
      }
    });
  },
};
