import { Injectable, Logger } from '@nestjs/common';
import { CommodityProjection } from '../entities/commodity-projection.entity';
import {
  CommodityProjectionProperty,
  CommodityProjectionRepo,
} from '../repositories/commodity-projection.repo';
import { Histogram, NumericBucket } from '../entities/histogram.entity';
import { HistogramDto } from '../dtos/histogram.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CommodityProjectionService {
  private readonly logger = new Logger(CommodityProjectionService.name);

  constructor(
    @InjectRepository(CommodityProjection)
    private readonly repo: CommodityProjectionRepo,
  ) {}

  /**
   * Provides a numeric or categorical histogram
   * for the chosen commodity projection data.
   *
   * @param prop The field with which to create a histogram
   * @returns The histogram for the field
   */
  async getHistogram(
    prop: CommodityProjectionProperty,
    bucketCount = 10,
  ): Promise<HistogramDto> {
    if (this.repo.isNumericProperty(prop)) {
      this.logger.debug(`Getting numeric histogram for ${prop}`);
      const histogram = await this.repo.getNumericHistogram(prop, bucketCount);
      this.normalizeNumericHistogram(histogram, bucketCount);
      return {
        type: 'numeric',
        buckets: histogram.buckets,
        start: histogram.start,
        end: histogram.end,
      };
    } else {
      this.logger.debug(`Getting category histogram for ${prop}`);
      const histogram = await this.repo.getCategoryHistogram(prop);
      return {
        type: 'category',
        buckets: histogram.buckets,
      };
    }
  }

  /**
   * Normalizes the histogram in place.
   *
   *   1. If there is an extra element beyond the count, it
   *       adds it to the final bucket and removes it
   *
   *   2. If there are missing buckets, it adds them with count 0
   *
   */
  normalizeNumericHistogram(histogram: Histogram, bucketCount: number) {
    if (Logger.isLevelEnabled('debug')) {
      this.logger.debug(
        `Normalizing numeric histogram: ${JSON.stringify(histogram)}`,
      );
    }

    const buckets = histogram.buckets as NumericBucket[];

    // First, combine the extra bucket into the final bucket
    const extraIndex = buckets.findIndex((b) => b.ordinal === bucketCount + 1);
    if (extraIndex > -1) {
      const extraBucket = buckets[extraIndex];
      const topBucket = buckets.find(
        (b: NumericBucket) => b.ordinal === bucketCount,
      );
      if (topBucket) {
        topBucket.count += extraBucket.count;
        buckets.splice(extraIndex, 1);
      } else {
        extraBucket.ordinal = bucketCount;
      }
    }

    // Fill in missing buckets
    for (let i = 0; i < bucketCount; i++) {
      if (buckets.length > i) {
        const bucket = buckets[i];
        if (bucket.ordinal > i + 1) {
          buckets.splice(i, 0, {
            ordinal: i + 1,
            count: 0,
          });
        }
      } else {
        buckets.push({
          ordinal: i + 1,
          count: 0,
        });
      }
    }

    if (Logger.isLevelEnabled('debug')) {
      this.logger.debug(`Normalized: ${JSON.stringify(histogram)}`);
    }
  }
}
