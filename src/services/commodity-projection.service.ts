import { Injectable } from '@nestjs/common';
import { CommodityProjection } from '../entities/commodity-projection.entity';
import { DataSource, Repository } from 'typeorm';
import {
  CommodityProjectionRepoExtension,
  CommodityProjectionProperty,
  repoExtension,
} from '../repositories/commodity-projection.repo';
import { CategoryBucket, NumericBucket } from '../entities/histogram.entity';
import {
  CategoryBucketDto,
  HistogramDto,
  NumericBucketDto,
} from '../dtos/histogram.dto';

@Injectable()
export class CommodityProjectionService {
  repo: Repository<CommodityProjection> & CommodityProjectionRepoExtension;
  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource
      .getRepository(CommodityProjection)
      .extend(repoExtension);
  }

  /**
   * This provides a numeric or categorical histogram
   * for the chosen commodity projection data.
   *
   * @param prop The field on which to create a histogram
   *
   * @returns The histogram for the field
   */
  async getHistogram(prop: CommodityProjectionProperty): Promise<HistogramDto> {
    if (this.repo.isNumericProperty(prop)) {
      return this.repo.getNumericHistogram(prop).then((histogram) => {
        return HistogramDto.fromDb({
          buckets: histogram.buckets.map((b: NumericBucket) =>
            NumericBucketDto.fromDb(b),
          ),
        });
      });
    } else {
      return this.repo
        .getCategoricalHistogramBuckets(prop)
        .then((histogram) => {
          return HistogramDto.fromDb({
            buckets: histogram.buckets.map((b: CategoryBucket) =>
              CategoryBucketDto.fromDb(b),
            ),
          });
        });
    }
  }
}
