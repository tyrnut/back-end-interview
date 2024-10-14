import { CommodityProjectionService } from './commodity-projection.service';
import { DataSource } from 'typeorm';
import { anything, instance, mock, when } from 'ts-mockito';
import {
  CommodityProjectionRepo,
  CommodityProjectionRepositoryExt,
} from '../repositories/commodity-projection.repo';

describe('histogram service', () => {
  let service: CommodityProjectionService;
  let repo: CommodityProjectionRepo;

  beforeEach(async () => {
    repo = mock<CommodityProjectionRepo>();
    const dataSource = mock(DataSource);
    const repoInstance = instance(repo);
    Object.assign(repoInstance, {
      isNumericProperty: { ...new CommodityProjectionRepositoryExt() }
        .isNumericProperty,
    });
    when(repo.extend(anything())).thenReturn(repoInstance);
    when(dataSource.getRepository(anything())).thenReturn(repoInstance);

    service = new CommodityProjectionService(repoInstance);
  });

  describe('Numeric histogram service', () => {
    it('should return a full numeric histogram with sufficient data', async () => {
      const sourceBuckets = [
        { ordinal: 1, count: 12 },
        { ordinal: 2, count: 1 },
        { ordinal: 3, count: 1 },
        { ordinal: 4, count: 1 },
        { ordinal: 5, count: 2 },
        { ordinal: 6, count: 1 },
        { ordinal: 7, count: 1 },
        { ordinal: 8, count: 1 },
        { ordinal: 9, count: 1 },
        { ordinal: 10, count: 9 },
        { ordinal: 11, count: 1 },
      ];
      when(repo.getNumericHistogram(anything(), anything())).thenReturn(
        Promise.resolve({
          type: 'numeric',
          buckets: sourceBuckets,
          start: 10,
          end: 40,
        }),
      );
      const result = await service.getHistogram('value', 10);
      expect(result).toEqual({
        type: 'numeric',
        buckets: [
          { ordinal: 1, count: 12 },
          { ordinal: 2, count: 1 },
          { ordinal: 3, count: 1 },
          { ordinal: 4, count: 1 },
          { ordinal: 5, count: 2 },
          { ordinal: 6, count: 1 },
          { ordinal: 7, count: 1 },
          { ordinal: 8, count: 1 },
          { ordinal: 9, count: 1 },
          { ordinal: 10, count: 10 },
        ],
        start: 10,
        end: 40,
      });
    });

    it('should have empty buckets when there is no data', async () => {
      const sourceBuckets = [];
      when(repo.getNumericHistogram(anything(), anything())).thenReturn(
        Promise.resolve({ type: 'numeric', buckets: sourceBuckets }),
      );
      const result = await service.getHistogram('value', 10);
      expect(result).toEqual({
        type: 'numeric',
        buckets: [
          { ordinal: 1, count: 0 },
          { ordinal: 2, count: 0 },
          { ordinal: 3, count: 0 },
          { ordinal: 4, count: 0 },
          { ordinal: 5, count: 0 },
          { ordinal: 6, count: 0 },
          { ordinal: 7, count: 0 },
          { ordinal: 8, count: 0 },
          { ordinal: 9, count: 0 },
          { ordinal: 10, count: 0 },
        ],
      });
    });

    it('should fill in missing buckets', async () => {
      const sourceBuckets = [
        { ordinal: 1, count: 2 },
        { ordinal: 7, count: 1 },
        { ordinal: 10, count: 3 },
        { ordinal: 11, count: 1 },
      ];

      when(repo.getNumericHistogram(anything(), anything())).thenReturn(
        Promise.resolve({
          type: 'numeric',
          buckets: sourceBuckets,
          start: 2,
          end: 99,
        }),
      );
      const result = await service.getHistogram('value', 10);
      expect(result).toEqual({
        type: 'numeric',
        buckets: [
          { ordinal: 1, count: 2 },
          { ordinal: 2, count: 0 },
          { ordinal: 3, count: 0 },
          { ordinal: 4, count: 0 },
          { ordinal: 5, count: 0 },
          { ordinal: 6, count: 0 },
          { ordinal: 7, count: 1 },
          { ordinal: 8, count: 0 },
          { ordinal: 9, count: 0 },
          { ordinal: 10, count: 4 },
        ],
        start: 2,
        end: 99,
      });
    });
  });

  describe('category histogram service', () => {
    it('should return a category histogram', async () => {
      const sourceBuckets = [
        { value: 'rice', count: 12 },
        { value: 'corn', count: 1 },
      ];
      when(repo.getCategoryHistogram(anything())).thenReturn(
        Promise.resolve({ type: 'category', buckets: sourceBuckets }),
      );
      const result = await service.getHistogram('commodity', 10);
      expect(result).toEqual({
        type: 'category',
        buckets: [
          { value: 'rice', count: 12 },
          { value: 'corn', count: 1 },
        ],
      });
    });

    it('should have empty buckets when there is no data', async () => {
      const sourceBuckets = [];
      when(repo.getCategoryHistogram(anything())).thenReturn(
        Promise.resolve({ type: 'category', buckets: sourceBuckets }),
      );
      const result = await service.getHistogram('commodity', 10);
      expect(result).toEqual({
        type: 'category',
        buckets: [],
      });
    });
  });
});
