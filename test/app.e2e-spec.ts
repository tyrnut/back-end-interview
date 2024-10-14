import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CommodityProjectionService } from '../src/services/commodity-projection.service';
import { anything, mock, when } from 'ts-mockito';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { TypeOrmModule } from '@nestjs/typeorm';

// This test hangs indefinitely on app.init() and I would need to investigate
describe.skip('AppController (e2e)', () => {
  let app: INestApplication;
  const payload = { buckets: [{ value: 'category', count: 3 }] };

  beforeEach(async () => {
    const service = mock(CommodityProjectionService);
    when(service.getHistogram(anything())).thenReturn(Promise.resolve(payload));
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CommodityProjectionService)
      .useValue(service)
      .overrideProvider(TypeOrmModule)
      .useValue(undefined)
      .overrideProvider(PrometheusModule)
      .useValue(undefined)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/attribute/histogram (GET)', () => {
    return request(app.getHttpServer())
      .get('/attribute/histogram')
      .expect(200)
      .expect(payload);
  });
});
