import { instance, mock } from 'ts-mockito';
import { CommodityProjectionRepo } from './commodity-projection.repo';
import { FakeCommodityProjectionRepoExt } from './commodity-projection.repo.fake';
import { AppModule } from '../app.module';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommodityProjection } from '../entities/commodity-projection.entity';

describe('CommodityProjection Repository Fake/Real test', () => {
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
  });

  beforeEach(async () => {
    await repo.delete({});
  });

  describe('numeric histogram', () => {
    test('empty numeric buckets for no data', async () => {
      const numericHistogram = await repo.getNumericHistogram('value', 5);
      expect(numericHistogram).toStrictEqual({ buckets: [] });
    });

    test('sparse buckets, sorted by ordinal', async () => {
      await repo.insert([
        { value: 1 },
        { value: 1 },
        { value: 1 },
        { value: 11 },
        { value: 12 },
        { value: 45 },
        { value: 44 },
        { value: 49 },
        { value: 50 },
      ]);
      const numericHistogram = await repo.getNumericHistogram('value', 5);
      expect(numericHistogram).toStrictEqual({
        buckets: [
          { ordinal: 1, count: 3 },
          { ordinal: 2, count: 2 },
          { ordinal: 5, count: 3 },
          { ordinal: 6, count: 1 },
        ],
        start: 1,
        end: 50,
      });
    });

    test('full buckets for full data, sorted by ordinal', async () => {
      await repo.insert([
        { value: 0 },
        { value: 10 },
        { value: 25 },
        { value: 35 },
        { value: 36 },
        { value: 45 },
        { value: 50 },
        { value: 50 },
      ]);
      const numericHistogram = await repo.getNumericHistogram('value', 5);
      expect(numericHistogram).toStrictEqual({
        buckets: [
          { ordinal: 1, count: 1 },
          { ordinal: 2, count: 1 },
          { ordinal: 3, count: 1 },
          { ordinal: 4, count: 2 },
          { ordinal: 5, count: 1 },
          { ordinal: 6, count: 2 },
        ],
        start: 0,
        end: 50,
      });
    });

    test('ignores missing values', async () => {
      await repo.insert([
        { value: 0 },
        { attribute: 'whatever' },
        { value: 10 },
        { value: 25 },
        { value: 35 },
        { value: 36 },
        { value: 45 },
        { value: 50 },
        { value: 50 },
      ]);
      const numericHistogram = await repo.getNumericHistogram('value', 5);
      expect(numericHistogram).toStrictEqual({
        buckets: [
          { ordinal: 1, count: 1 },
          { ordinal: 2, count: 1 },
          { ordinal: 3, count: 1 },
          { ordinal: 4, count: 2 },
          { ordinal: 5, count: 1 },
          { ordinal: 6, count: 2 },
        ],
        start: 0,
        end: 50,
      });
    });

    test('all values equal', async () => {
      await repo.insert([{ value: 0 }, { value: 0 }, { value: 0 }]);
      const numericHistogram = await repo.getNumericHistogram('value', 5);
      expect(numericHistogram).toStrictEqual({
        buckets: [{ ordinal: 1, count: 3 }],
        start: 0,
        end: 0,
      });
    });
  });

  describe('category histogram', () => {
    test('no data', async () => {
      const categoryHistogram = await repo.getCategoryHistogram('attribute');
      expect(categoryHistogram).toStrictEqual({ buckets: [] });
    });

    test('missing data', async () => {
      await repo.insert([{ attribute: 'yield' }, { value: 29 }]);
      const categoryHistogram = await repo.getCategoryHistogram('attribute');
      expect(categoryHistogram).toStrictEqual({
        buckets: [{ value: 'yield', count: 1 }],
      });
    });

    test('category histogram has exact buckets, sorted by name', async () => {
      await repo.insert([
        { attribute: 'yield' },
        { attribute: 'yield' },
        { attribute: 'acres' },
        { attribute: 'acres' },
        { attribute: 'acres' },
      ]);
      const categoryHistogram = await repo.getCategoryHistogram('attribute');
      expect(categoryHistogram).toStrictEqual({
        buckets: [
          { value: 'acres', count: 3 },
          { value: 'yield', count: 2 },
        ],
      });
    });
  });
});
