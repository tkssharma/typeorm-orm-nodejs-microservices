import { IsString, IsEmail, IsOptional, MaxLength, MinLength, IsStrongPassword, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Role } from '../enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ description: 'User first name', example: 'John', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ description: 'User last name', example: 'Doe', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ description: 'User role', example: 'user', enum: Role, default: Role.USER })
  @IsOptional()
  @IsEnum(Role, { message: 'Role must be one of: user, admin, editor' })
  role?: Role;

  @ApiProperty({ description: 'User email address', example: 'john.doe@example.com' })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password - must be at least 8 characters with uppercase, lowercase, number and symbol',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  @IsString()
  @MinLength(8)
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password!: string;

  @ApiPropertyOptional({ description: 'User biography', example: 'Software developer with 5 years experience' })
  @IsOptional()
  @IsString()
  bio?: string;
}


export class UserResponse {

  @ApiResponseProperty({
    type: Number,
    example: 1,
  })
  id!: number;

  @ApiResponseProperty({
    type: String,
    example: 'John',
  })
  firstName!: string;

  @ApiResponseProperty({
    type: String,
    example: 'Doe',
  })
  lastName!: string;

  @ApiResponseProperty({
    type: String,
    example: 'john.doe@example.com',
  })
  email!: string;

  @ApiResponseProperty({
    type: String,
    example: 'Software developer with 5 years experience',
  })
  bio?: string;

  @ApiResponseProperty({
    type: Date,
    example: '2025-10-16T10:30:00.000Z',
  })
  createdAt!: Date;

  @ApiResponseProperty({
    type: Date,
    example: '2025-10-16T10:30:00.000Z',
  })
  updatedAt!: Date;
}