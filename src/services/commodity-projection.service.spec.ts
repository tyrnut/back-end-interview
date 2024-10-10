import { Test, TestingModule } from '@nestjs/testing';
import { CommodityProjectionService } from './commodity-projection.service';

describe('Test commodity projection service', () => {
  let service: CommodityProjectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommodityProjectionService],
    }).compile();

    service = module.get<CommodityProjectionService>(
      CommodityProjectionService,
    );
  });

  it('should return a full numeric histogram with sufficient data', async () => {
    let result = await service.getHistogram('value');
    expect(result.buckets.map((b) => Object.assign({}, b))).toBe(result.buckets);
  });

  // Empty for no data
  // missing buckets for missing data
  // extra bucket for exact max
});
