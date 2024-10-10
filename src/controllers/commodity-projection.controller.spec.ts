import { Test, TestingModule } from '@nestjs/testing';
import { CommodityProjectionController } from './commodity-projection.controller';
import { CommodityProjectionService } from '../services/commodity-projection.service';
import { HistogramDto } from 'src/dtos/histogram.dto';
import { Histogram } from 'src/entities/histogram.entity';
import { DataSource } from 'typeorm';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

jest.mock('typeorm', () => {
  return {
    DataSource: jest.fn().mockImplementation(() => ({
      getRepository: jest.fn().mockReturnValue({
        extend: jest.fn().mockResolvedValue({}),
      }),
    })),
  };
});

describe('commodity projection controller tests', () => {
  let controller: CommodityProjectionController;
  let service: CommodityProjectionService;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [CommodityProjectionController],
      providers: [CommodityProjectionService],
    }).compile();

    controller = module.get<CommodityProjectionController>(
      CommodityProjectionController,
    );
  });

  it('should return the histogram for value', async () => {
    const dto: HistogramDto = {
      buckets: [{
        ordinal: 1,
        count: 10
      }]
    }

    const dbModel: Histogram = {
      buckets: [
        {
          ordinal: 1,
          count: 10
        }
      ]
    }

    jest.spyOn(service, 'getHistogram').mockImplementation(async () => dbModel);

    expect(await controller.getHistogram('value')).toBe(dto);
  });
});
