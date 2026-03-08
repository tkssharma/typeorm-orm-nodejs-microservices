import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'User email address', example: 'john.doe@example.com' })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'User password', example: 'SecurePass123!' })
  @Transform(({ value }: { value: string }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id!: number;

  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  email!: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  firstName!: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  lastName!: string;

  @ApiProperty({ description: 'User role', example: 'user' })
  role!: string;

  @ApiProperty({ description: 'JWT access token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ description: 'Login success message', example: 'Login successful' })
  message!: string;
}
