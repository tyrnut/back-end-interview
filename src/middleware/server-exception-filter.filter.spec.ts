import { ServerExceptionFilter } from './server-exception-filter.filter';
import { AbstractHttpAdapter, HttpAdapterHost } from '@nestjs/core';
import { anything, instance, mock, verify, when } from 'ts-mockito';
import { ArgumentsHost } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { CONFIG, MODE_PROD } from '../config';

describe('ServerExceptionFilter', () => {
  it('should remove exception message in production', () => {
    const adapterHost = mock(HttpAdapterHost);
    const httpAdapter = mock<AbstractHttpAdapter>();
    const httpArgumentsHost = mock<HttpArgumentsHost>();
    const argumentsHost = mock<ArgumentsHost>();

    when(argumentsHost.switchToHttp()).thenReturn(httpArgumentsHost);
    when(adapterHost.httpAdapter).thenReturn(instance(httpAdapter));
    when(httpAdapter.getRequestUrl(anything())).thenReturn('test url');

    const adapterHostInstance = instance(adapterHost);
    const filter = new ServerExceptionFilter(adapterHostInstance);

    CONFIG.getMode = () => MODE_PROD;
    filter.catch(Error('some error'), instance(argumentsHost));

    verify(httpAdapter.reply(anything(), anything(), anything())).once();
  });
});
