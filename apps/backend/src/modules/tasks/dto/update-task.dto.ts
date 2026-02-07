import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({
    description: '실제 소요 시간 (시간 단위)',
    example: 10.5,
  })
  @IsOptional()
  @IsNumber()
  actualHours?: number;
}
