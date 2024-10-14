import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CommodityProjection } from '../src/entities/commodity-projection.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('commodity projection service E2E test', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const repository = app.get(getRepositoryToken(CommodityProjection));
    await repository.clear();
    await repository.insert([
      { attribute: 'yield', value: 20 },
      { attribute: 'yield', value: 220 },
      { attribute: 'acres', value: 1020 },
    ]);
    await app.init();
  });

  it('/attribute/histogram (GET)', () => {
    return request(app.getHttpServer())
      .get('/attribute/histogram')
      .expect(200)
      .expect({
        type: 'category',
        buckets: [
          { value: 'acres', count: 1 },
          { value: 'yield', count: 2 },
        ],
      });
  });

  it('/value/histogram (GET)', () => {
    return request(app.getHttpServer())
      .get('/value/histogram')
      .expect(200)
      .expect({
        type: 'numeric',
        buckets: [
          { ordinal: 1, count: 1 },
          { ordinal: 2, count: 0 },
          { ordinal: 3, count: 1 },
          { ordinal: 4, count: 0 },
          { ordinal: 5, count: 0 },
          { ordinal: 6, count: 0 },
          { ordinal: 7, count: 0 },
          { ordinal: 8, count: 0 },
          { ordinal: 9, count: 0 },
          { ordinal: 10, count: 1 },
        ],
        start: 20,
        end: 1020,
      });
  });
});
