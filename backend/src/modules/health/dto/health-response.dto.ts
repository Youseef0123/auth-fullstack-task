import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok'] })
  status!: 'ok';

  @ApiProperty({ example: 'up', enum: ['up'] })
  database!: 'up';

  @ApiProperty({ example: 42, description: 'Process uptime in seconds' })
  uptime!: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  timestamp!: string;
}
