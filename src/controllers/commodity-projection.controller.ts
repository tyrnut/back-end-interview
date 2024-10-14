import {
  Controller,
  Get,
  NotFoundException,
  Param,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommodityProjectionService } from '../services/commodity-projection.service';
import { CommodityProjectionProperty } from '../repositories/commodity-projection.repo';
import { HistogramDto } from '../dtos/histogram.dto';
import { SUPPORTED_VERSIONS } from '../constants';

const pathParamToEntityProperty: Map<string, CommodityProjectionProperty> =
  new Map([
    ['attribute', 'attribute'],
    ['commodity', 'commodity'],
    ['commoditytype', 'commodityType'],
    ['units', 'units'],
    ['yeartype', 'yearType'],
    ['year', 'year'],
    ['value', 'value'],
  ]);

@Controller({
  path: ':dimension',
  version: [...SUPPORTED_VERSIONS, VERSION_NEUTRAL],
})
export class CommodityProjectionController {
  constructor(private readonly service: CommodityProjectionService) {}

  @Get('/histogram')
  async getHistogram(
    @Param('dimension') dimension: string,
  ): Promise<HistogramDto> {
    const key = dimension.trim().toLowerCase();
    const entityProperty = pathParamToEntityProperty.get(key);
    if (entityProperty) {
      return this.service.getHistogram(entityProperty);
    }
    throw new NotFoundException(
      `Invalid commodity projection dimension: ${dimension}`,
    );
  }
}
