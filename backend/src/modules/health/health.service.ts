import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';
import { HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async check(): Promise<HealthResponseDto> {
    if (!(await this.isDatabaseUp())) {
      throw new ServiceUnavailableException('Database connection is down');
    }

    return {
      status: 'ok',
      database: 'up',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  private async isDatabaseUp(): Promise<boolean> {
    const { db, readyState } = this.connection;
    if (readyState !== ConnectionStates.connected || !db) {
      return false;
    }

    try {
      await db.admin().ping();
      return true;
    } catch {
      return false;
    }
  }
}
