import { CommodityProjection } from '../entities/commodity-projection.entity';

export class CommodityProjectionDto {
  attribute?: string;
  commodity?: string;
  commodityType?: string;
  units?: string;
  yearType?: string;
  year?: string;
  value?: number;

  static fromDb(proj: CommodityProjection): CommodityProjectionDto {
    return {
      attribute: proj.attribute,
      commodity: proj.commodity,
      commodityType: proj.commodityType,
      units: proj.units,
      yearType: proj.yearType,
      year: proj.year,
      value: proj.value,
    };
  }
}
