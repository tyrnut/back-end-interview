import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export const tableName = 'commodity_projection';

@Entity({
  name: tableName,
})
export class CommodityProjection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  attribute?: string;

  @Column()
  commodity?: string;

  @Column({ name: 'commodity_type' })
  commodityType?: string;

  @Column()
  units?: string;

  @Column({ name: 'year_type' })
  yearType?: string;

  @Column()
  year?: string;

  @Column()
  value?: number;
}
