import { IsOptional, IsEnum, IsString, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@msspbiz/shared';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: '사용자 이름',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: '사용자 역할',
    enum: UserRole,
    example: UserRole.EDITOR,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: '활성 상태',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
