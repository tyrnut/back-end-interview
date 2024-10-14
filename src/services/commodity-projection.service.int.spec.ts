import { CommodityProjectionService } from './commodity-projection.service';
import { instance, mock } from 'ts-mockito';
import { CommodityProjectionRepo } from '../repositories/commodity-projection.repo';
import { FakeCommodityProjectionRepoExt } from '../repositories/commodity-projection.repo.fake';
import { AppModule } from '../app.module';
import { Test } from '@nestjs/testing';
import { CommodityProjection } from '../entities/commodity-projection.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Test commodity projection histogram service', () => {
  let service: CommodityProjectionService;
  let repo: CommodityProjectionRepo;

  beforeAll(async () => {
    if (process.env.INTEGRATION_TEST === 'true') {
      const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      const app = moduleFixture.createNestApplication();
      repo = app.get(getRepositoryToken(CommodityProjection));
    } else {
      const mockedRepo = mock<CommodityProjectionRepo>();
      repo = Object.assign(instance(mockedRepo), {
        ...new FakeCommodityProjectionRepoExt(),
      });
    }

    service = new CommodityProjectionService(repo);
  });

  beforeEach(async () => {
    await repo.clear();
  });

  describe('numeric histogram', () => {
    it('should support full buckets', async () => {
      // Bucket 1
      await repo.insert({ value: 4 });
      await repo.insert({ value: 5 });
      await repo.insert({ value: 6 });
      // 2
      await repo.insert({ value: 15 });
      // 3
      await repo.insert({ value: 25 });
      // 4
      await repo.insert({ value: 35 });
      // 5
      await repo.insert({ value: 45 });
      await repo.insert({ value: 45 });
      // 6
      await repo.insert({ value: 55 });
      // 7
      await repo.insert({ value: 65 });
      // 8
      await repo.insert({ value: 75 });
      // 9
      await repo.insert({ value: 85 });
      // 10
      await repo.insert({ value: 95 });
      await repo.insert({ value: 97 });
      await repo.insert({ value: 98 });
      // 11
      await repo.insert({ value: 100 });

      const result = await service.getHistogram('value', 10);
      expect(result).toEqual({
        type: 'numeric',
        buckets: [
          { ordinal: 1, count: 3 },
          { ordinal: 2, count: 1 },
          { ordinal: 3, count: 1 },
          { ordinal: 4, count: 1 },
          { ordinal: 5, count: 2 },
          { ordinal: 6, count: 1 },
          { ordinal: 7, count: 1 },
          { ordinal: 8, count: 1 },
          { ordinal: 9, count: 1 },
          { ordinal: 10, count: 4 },
        ],
        start: 4,
        end: 100,
      });
    });

    it('should add missing bucketsx', async () => {
      // Bucket 1
      await repo.insert({ value: 0 });
      await repo.insert({ value: 5 });
      await repo.insert({ value: 6 });
      // 3
      await repo.insert({ value: 25 });
      // 6
      await repo.insert({ value: 50 });

      const result = await service.getHistogram('value', 5);
      expect(result).toEqual({
        type: 'numeric',
        buckets: [
          { ordinal: 1, count: 3 },
          { ordinal: 2, count: 0 },
          { ordinal: 3, count: 1 },
          { ordinal: 4, count: 0 },
          { ordinal: 5, count: 1 },
        ],
        start: 0,
        end: 50,
      });
    });

    it('should return empty buckets when there is no range', async () => {
      const result = await service.getHistogram('value', 5);
      expect(result).toEqual({
        type: 'numeric',
        buckets: [
          { ordinal: 1, count: 0 },
          { ordinal: 2, count: 0 },
          { ordinal: 3, count: 0 },
          { ordinal: 4, count: 0 },
          { ordinal: 5, count: 0 },
        ],
      });
    });
  });

  describe('category histogram', () => {
    it('should add up buckets', async () => {
      await repo.insert({ year: '2020/21' });
      await repo.insert({ year: '2020/21' });
      await repo.insert({ year: '2012' });

      const result = await service.getHistogram('year', 10);
      expect(result).toEqual({
        type: 'category',
        buckets: [
          { value: '2012', count: 1 },
          { value: '2020/21', count: 2 },
        ],
      });
    });

    it('should return empty buckets when no data', async () => {
      const result = await service.getHistogram('year', 5);
      expect(result).toEqual({
        type: 'category',
        buckets: [],
      });
    });
  });
});
