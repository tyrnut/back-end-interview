import { Logger } from '@nestjs/common';

export const MODE_PROD = 'prod';
export const MODE_DEV = 'dev';

class Config {
  static logger = new Logger(Config.name);
  getMode(): string {
    return process.env.MODE ?? 'dev';
  }

  getApiPort(): number | undefined {
    try {
      if (process.env.API_PORT) {
        return parseInt(process.env.API_PORT);
      }
    } catch {
      Config.logger.error(`Invalid API port in config:`, process.env.API_PORT);
    }
  }

  getDbHost(): string | undefined {
    return process.env.DB_HOST;
  }

  getDbPort(): number | undefined {
    try {
      if (process.env.DB_PORT) {
        return parseInt(process.env.DB_PORT);
      }
    } catch {
      Config.logger.error(`Invalid DB port in config:`, process.env.DB_PORT);
    }
  }

  getDbName(): string | undefined {
    return process.env.DB_NAME;
  }

  getDbSchema(): string | undefined {
    return process.env.DB_SCHEMA;
  }

  getDbUser(): string | undefined {
    return process.env.DB_USER;
  }

  getDbPassword(): string | undefined {
    return process.env.DB_PASSWORD;
  }
}

export const CONFIG = new Config();
