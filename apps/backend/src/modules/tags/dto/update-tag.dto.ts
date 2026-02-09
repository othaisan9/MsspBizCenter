import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateTagDto {
  @ApiProperty({ description: '변경할 태그 이름', example: '보안관제' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;
}
