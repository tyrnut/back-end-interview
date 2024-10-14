import { Repository } from 'typeorm';
import { floor, snakeCase } from 'lodash';
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
  CommodityProjectionRepositoryExt;

/** The repository extension for CommodityProjection
 *
 *  Note (which belongs in the readme normally):
 *   typeORM uses Object.assign to extend repositories,
 *   but classes have to be traversed through the prototype chain
 *   to get all the methods. So to work around that, the methods
 *   are prefixed with '_' and non-prefixed properties point to them,
 *   so that when using spread syntax, all the properties from the
 *   hierarchy are in the object. With this approach, the extension
 *   can be added with: repo.extend({...new Extension()})
 *
 *   'this' should not be bound to the properties because 'this' needs
 *    to refer to the repository that typeORM creates
 */
export class CommodityProjectionRepositoryExt {
  /**
   * Only numeric properties can be used to create
   * numeric histograms. Everything else is
   * categorical.
   */
  _isNumericProperty(prop: CommodityProjectionProperty): boolean {
    return prop === 'value';
  }

  _validateCategoryHistogramArgs(prop: CommodityProjectionProperty) {
    if (prop === 'value') {
      throw Error(`numeric property ${prop} passed for category histogram`);
    }
  }

  _validateNumericHistogramArgs(
    prop: CommodityProjectionProperty,
    bucketCount: number,
  ) {
    if (prop !== 'value') {
      throw Error(`Non numeric property ${prop} passed for numeric histogram`);
    }
    bucketCount = floor(bucketCount);
    if (bucketCount < 1) {
      throw Error(`Bucket count must be positive: ${bucketCount}`);
    }
  }

  /**
   * @returns Histogram with zero or more {CategoryBucket[]}, ordered by category
   */
  async _getCategoryHistogram(
    prop: CommodityProjectionProperty,
  ): Promise<Histogram> {
    this.validateCategoryHistogramArgs(prop);
    const column = snakeCase(prop);
    const sql = `SELECT ${column} AS value, COUNT(*)::int AS count FROM ${tableName} WHERE ${column} IS NOT NULL GROUP BY ${column} ORDER BY ${column}`;

    const repo = this as unknown as CommodityProjectionRepo;
    return repo.manager
      .query<CategoryBucket[]>(sql)
      .then((buckets) => HistogramSchema.parse({ buckets: buckets }));
  }

  /**
   *
   * Note about Numeric histograms:
   *   If the table is empty, there will be no buckets.
   *   If a bucket is empty, that bucket will not be in the response
   *   There will almost always be an extra bucket with ordinal (bucketCount + 1)
   *     for values that are exactly at the maximum
   *
   * @param bucketCount Number of buckets for the histogram
   * @returns A Histogram with 0 or more buckets, up to bucketCount + 1, ordered by ordinal
   */
  async _getNumericHistogram(
    prop: CommodityProjectionProperty,
    bucketCount: number,
  ): Promise<Histogram> {
    this.validateNumericHistogramArgs(prop, bucketCount);

    const column = snakeCase(prop);

    // This has to handle a special case where all the values are the same in the table, in which case
    //   there is only a single bucket.
    const sql = `
      WITH range AS (
        SELECT 
          MIN(${column}) AS min_val, 
          MAX(${column}) AS max_val 
        FROM 
          ${tableName}
      ), width_buckets AS (
        SELECT 
          CASE 
            WHEN (SELECT min_val FROM range) = (SELECT max_val FROM range) 
            THEN 1
            ELSE
              WIDTH_BUCKET(
                ${column},
                (SELECT min_val FROM range), 
                (SELECT max_val FROM range),
                ${bucketCount}
              )
          END AS ordinal, 
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
    const repo = this as unknown as CommodityProjectionRepo;
    // The response will always come back empty with an array size of 1
    return repo.manager.query<Record<string, any>[]>(sql).then((histograms) => {
      return histograms.length && histograms[0]['buckets']
        ? HistogramSchema.parse(histograms[0])
        : { buckets: [] };
    });
  }

  isNumericProperty = this._isNumericProperty;
  validateCategoryHistogramArgs = this._validateCategoryHistogramArgs;
  validateNumericHistogramArgs = this._validateNumericHistogramArgs;
  getCategoryHistogram = this._getCategoryHistogram;
  getNumericHistogram = this._getNumericHistogram;
}
