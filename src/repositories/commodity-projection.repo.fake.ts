import {
  DeleteResult,
  FindOptionsWhere,
  InsertResult,
  ObjectId,
} from 'typeorm';
import { CommodityProjection } from '../entities/commodity-projection.entity';
import {
  CategoryBucket,
  Histogram,
  NumericBucket,
} from '../entities/histogram.entity';
import {
  CommodityProjectionProperty,
  CommodityProjectionRepositoryExt,
} from './commodity-projection.repo';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { max, min } from 'lodash';

export class FakeCommodityProjectionRepoExt extends CommodityProjectionRepositoryExt {
  idSeq: 1;
  records: QueryDeepPartialEntity<CommodityProjection>[] = [];

  async _clear(): Promise<void> {
    this.records = [];
  }

  async _insert(
    entity:
      | QueryDeepPartialEntity<CommodityProjection>
      | QueryDeepPartialEntity<CommodityProjection>[],
  ): Promise<InsertResult> {
    if (Array.isArray(entity)) {
      entity.forEach((e) => (e.id = this.idSeq++));
      this.records.push(...entity);
    } else {
      entity.id = this.idSeq++;
      this.records.push(entity);
    }
    return {
      generatedMaps: [],
      identifiers: [],
      raw: '',
    }; // No need for insert results right now
  }

  async _getCategoryHistogram(
    prop: CommodityProjectionProperty,
  ): Promise<Histogram> {
    this.validateCategoryHistogramArgs(prop);
    const records = this.records as CommodityProjection[];
    const bucketObj = records
      .filter((cp) => cp[prop] !== undefined) // Get records with a value (not undefined) for the property
      .reduce(
        (acc, curr) => {
          const propertyValue = curr[prop]!;
          acc[propertyValue] = (acc[propertyValue] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    const buckets = Object.entries(bucketObj)
      .map(([value, count]): CategoryBucket => ({ value: value, count }))
      .sort((a, b) => a.value.localeCompare(b.value));

    return { buckets };
  }

  async _getNumericHistogram(
    prop: CommodityProjectionProperty,
    bucketCount: number,
  ): Promise<Histogram> {
    this.validateNumericHistogramArgs(prop, bucketCount);

    const records = this.records as CommodityProjection[];
    if (records.length == 0) {
      return { buckets: [] };
    }

    const filteredRecords = records.filter((cp) => cp[prop] !== undefined);

    // Get minimum/maximum
    const values: number[] = filteredRecords.map(
      (cp): number => cp[prop] as number,
    );
    const minimum = min(values) as number;
    const maximum = max(values) as number;

    if (minimum === maximum) {
      // If bounds are equal, pg returns error
      return {
        buckets: [{ ordinal: 1, count: values.length }],
        start: minimum,
        end: maximum,
      };
    }

    type GroupingBucket = {
      // Checks if the value falls in the range of the bucket
      check: (value: number) => boolean;
      bucket: NumericBucket;
    };

    // Create the bucket groups
    const bucketGroups: GroupingBucket[] = [];
    const bucketSize = (maximum - minimum) / bucketCount;
    for (let i = 0; i <= bucketCount; i++) {
      // Make sure to add the extra bucket with '<= bucketCount'
      const bottom = minimum + bucketSize * i;
      const top = bottom + bucketSize;
      bucketGroups.push({
        check: (value) => value >= bottom && value < top,
        bucket: {
          ordinal: i + 1,
          count: 0,
        },
      });
    }

    // Add 1 count for each record that falls within a bucketGroup's range
    filteredRecords.forEach((record) => {
      for (const grp of bucketGroups) {
        const val = parseInt(`${record[prop]!}`);
        if (grp.check(val)) {
          grp.bucket.count += 1;
          break;
        }
      }
    });
    const buckets = bucketGroups
      .map((group) => group.bucket)
      .filter((b) => b.count > 0)
      .sort((a, b) => a.ordinal - b.ordinal);

    return {
      buckets,
      start: minimum,
      end: maximum,
    };
  }

  async _delete(
    criteria:
      | string
      | number
      | string[]
      | Date
      | ObjectId
      | number[]
      | Date[]
      | ObjectId[]
      | FindOptionsWhere<CommodityProjection>,
  ): Promise<DeleteResult> {
    if (Object.keys(criteria).length > 0) {
      throw new Error('Only supports deleting all');
    }
    const count = this.records.length;
    this.records = [];
    return {
      raw: `DELETE ${count}`,
    };
  }

  clear = this._clear;
  insert = this._insert;
  getCategoryHistogram = this._getCategoryHistogram;
  getNumericHistogram = this._getNumericHistogram;
  delete = this._delete;
}
