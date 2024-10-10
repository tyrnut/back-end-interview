import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class Init1728502259601 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'commodity_projection',
        columns: [
          { name: 'id', type: 'serial' },
          { name: 'attribute', type: 'TEXT', isNullable: true },
          { name: 'commodity', type: 'TEXT', isNullable: true },
          { name: 'commodity_type', type: 'TEXT', isNullable: true },
          { name: 'units', type: 'TEXT', isNullable: true },
          { name: 'year_type', type: 'TEXT', isNullable: true },
          { name: 'year', type: 'TEXT', isNullable: true },
          { name: 'value', type: 'REAL', isNullable: true },
        ],
        indices: [
          { columnNames: ['attribute'] },
          { columnNames: ['commodity'] },
          { columnNames: ['commodity_type'] },
          { columnNames: ['units'] },
          { columnNames: ['year_type'] },
          { columnNames: ['year'] },
          { columnNames: ['value'] },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('commodity_projection');
  }
}
