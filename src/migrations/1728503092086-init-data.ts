import { MigrationInterface, QueryRunner } from 'typeorm';
import { parse } from 'csv-parse';
import { CommodityProjection } from 'src/entities/commodity-projection.entity';
import * as fs from 'fs';

export class InitData1728503092086 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const stream = fs.createReadStream(`seed_data/Projection2021.csv`);
    const parser = stream.pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        bom: true, // File is utf8 with Byte order mark
      }),
    );
    const projectionsToAdd = []; // There are only 3000 in the initial file
    const repo =
      queryRunner.manager.getRepository<CommodityProjection>(
        CommodityProjection,
      );

    for await (const record of parser) {
      const commProjection = repo.create({
        attribute: record?.['Attribute'],
        commodity: record?.['Commodity'],
        commodityType: record?.['CommodityType'],
        units: record?.['Units'],
        yearType: record?.['YearType'],
        year: record?.['Year'],
        value: record?.['Value'],
      });

      projectionsToAdd.push(commProjection);
    }
    await repo.insert(projectionsToAdd);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Not truncating just in case this is mistaken and
    //   need to recover the data
    queryRunner.query('DELETE FROM commodity_projection');
  }
}
