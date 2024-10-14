import { z } from 'zod';

export const CommodityProjectionDtoSchema = z.object({
  attribute: z.string().optional(),
  commodity: z.string().optional(),
  commodityType: z.string().optional(),
  units: z.string().optional(),
  yearType: z.string().optional(),
  year: z.string().optional(),
  value: z.string().optional(),
});

export type CommodityProjectionDto = z.infer<
  typeof CommodityProjectionDtoSchema
>;
