import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Cannot GET /api/unknown',
  })
  message!: string | string[];

  @ApiProperty({ example: 'Not Found' })
  error!: string;

  @ApiProperty({ example: '/api/unknown' })
  path!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  timestamp!: string;
}
