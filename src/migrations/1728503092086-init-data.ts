import { MigrationInterface, QueryRunner } from 'typeorm';
import { parse } from 'csv-parse';
import { tableName } from '../entities/commodity-projection.entity';
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

    // The following is the best way I could find in
    //   typeORM to do bulk inserts without an Entity.
    //   Regular inserts are insanely slow.

    let allParamSets: string[] = []; // ["($1, $2, $3)", "($4, $5, $6)"]
    let allParamValues: string[] = []; // ['attr1', 'comm1', 'commtype1', 'attr2, 'comm2', 'commtype2']
    for await (const record of parser) {
      // Not using DB model because that
      //  can change, and the migration
      //  should never change.
      const paramSetLocation = allParamSets.length * 7 + 1;
      const paramSet: string[] = [];
      for (let i = 0; i < 7; i++) {
        paramSet.push(`$${paramSetLocation + i}`);
      }
      allParamSets.push(`(${paramSet.join(',')})`);

      allParamValues.push(
        ...[
          record?.['Attribute'],
          record?.['Commodity'],
          record?.['CommodityType'],
          record?.['Units'],
          record?.['YearType'],
          record?.['Year'],
          record?.['Value'],
        ],
      );

      if (allParamSets.length > 1000) {
        await this.bulkInsert(queryRunner, allParamSets, allParamValues);
        allParamSets = [];
        allParamValues = [];
      }
    }
    if (allParamSets.length > 0) {
      await this.bulkInsert(queryRunner, allParamSets, allParamValues);
    }
  }

  async bulkInsert(
    queryRunner: QueryRunner,
    paramSets: string[],
    values: string[],
  ): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO commodity_projection 
      (attribute, commodity, commodity_type, units, year_type, year, value) 
      VALUES 
      ${paramSets.join(',')}
      `,
      values,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Truncating is fast, but it has undesirable side effects
    //   for other running transactions
    queryRunner.query(`DELETE FROM ${tableName}`);
  }
}
