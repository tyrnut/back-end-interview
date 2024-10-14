import { Controller, Get, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Response } from 'express';

/**
 * The only reason this exists is to set the version
 */
@Controller({ version: VERSION_NEUTRAL })
export class CustomPrometheusController extends PrometheusController {
  @Get()
  async index(@Res({ passthrough: true }) response: Response) {
    return super.index(response);
  }
}
