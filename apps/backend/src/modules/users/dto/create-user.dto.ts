import { IsEmail, IsString, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@msspbiz/shared';

export class CreateUserDto {
  @ApiProperty({
    description: '사용자 이메일',
    example: 'newuser@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: '임시 비밀번호',
    example: 'TempPass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: '사용자 역할',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
