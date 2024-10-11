import { CommodityProjectionService } from './commodity-projection.service';
import { DataSource } from 'typeorm';
import { anything, instance, mock, when } from 'ts-mockito';
import { CommodityProjectionRepo } from '../repositories/commodity-projection.repo';

function before(): {
  repository: CommodityProjectionRepo;
  svc: CommodityProjectionService;
} {
  const repository = mock<CommodityProjectionRepo>();
  const dataSource = mock(DataSource);
  const repoInstance = instance(repository);

  when(repository.extend(anything())).thenReturn(repoInstance);
  when(dataSource.getRepository(anything())).thenReturn(repoInstance);

  const svc = new CommodityProjectionService(instance(dataSource));

  return { repository, svc };
}

describe('Test Numeric histogram service', () => {
  let service: CommodityProjectionService;
  let repo: CommodityProjectionRepo;

  beforeEach(async () => {
    const { repository, svc } = before();
    service = svc;
    repo = repository;
    when(repo.isNumericProperty(anything())).thenReturn(true);
  });

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
      Promise.resolve({ buckets: sourceBuckets, start: 10, end: 40 }),
    );
    const result = await service.getHistogram('value', 10);
    expect(result).toEqual({
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
      Promise.resolve({ buckets: sourceBuckets }),
    );
    const result = await service.getHistogram('value', 10);
    expect(result).toEqual({
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
      Promise.resolve({ buckets: sourceBuckets, start: 2, end: 99 }),
    );
    const result = await service.getHistogram('value', 10);
    expect(result).toEqual({
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

describe('Test category histogram service', () => {
  let service: CommodityProjectionService;
  let repo: CommodityProjectionRepo;

  beforeEach(async () => {
    const { repository, svc } = before();
    service = svc;
    repo = repository;
    when(repo.isNumericProperty(anything())).thenReturn(false);
  });

  it('should return a category histogram', async () => {
    const sourceBuckets = [
      { value: 'rice', count: 12 },
      { value: 'corn', count: 1 },
    ];

    when(repo.getCategoryHistogramBuckets(anything())).thenReturn(
      Promise.resolve({ buckets: sourceBuckets }),
    );
    const result = await service.getHistogram('commodity', 10);
    expect(result).toEqual({
      buckets: [
        { value: 'rice', count: 12 },
        { value: 'corn', count: 1 },
      ],
    });
  });

  it('should have empty buckets when there is no data', async () => {
    const sourceBuckets = [];
    when(repo.getCategoryHistogramBuckets(anything())).thenReturn(
      Promise.resolve({ buckets: sourceBuckets }),
    );
    const result = await service.getHistogram('commodity', 10);
    expect(result).toEqual({
      buckets: [],
    });
  });
});
