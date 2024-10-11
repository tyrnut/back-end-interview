import { CommodityProjectionController } from './commodity-projection.controller';
import { CommodityProjectionService } from '../services/commodity-projection.service';
import { anything, instance, mock, when } from 'ts-mockito';
import { NotFoundException } from '@nestjs/common';

describe('commodity projection controller tests', () => {
  let controller: CommodityProjectionController;

  beforeEach(async () => {
    const service = mock(CommodityProjectionService);
    when(service.getHistogram(anything())).thenReturn(
      Promise.resolve({ buckets: [] }),
    );
    controller = new CommodityProjectionController(instance(service));
  });

  it('Ignores case and whitespace', async () => {
    await controller.getHistogram(' AtTribute ');
    await controller.getHistogram('  VaLue ');
  });

  it('Throws for unrecognized dimension', async () => {
    try {
      await controller.getHistogram('unknown dimension');
    } catch (ex) {
      if (!(ex instanceof NotFoundException)) {
        throw ex;
      }
    }
  });
});
